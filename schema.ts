import { text, relationship, password, timestamp, select, float, multiselect, virtual, checkbox, integer, json } from "@keystone-6/core/fields";
import { denyAll } from "@keystone-6/core/access";
import type { Lists } from ".keystone/types";
import { graphql, list } from "@keystone-6/core";

export type Session = {
  itemId: string;
  data: {
    isBlocked: boolean;
    username: string;
    role: "admin" | "customer" | "employee" | "manager";
    permissions: any;
  };
};

function isAdmin({ session }: { session?: Session }) {
  if (!session) return false;

  if (session.data.role == "admin") return true;

  return !session.data.isBlocked;
}

function isManager({ session }: { session?: Session }) {
  if (!session) return false;

  if (session.data.role == "admin" || session.data.role == "manager") return true;

  return !session.data.isBlocked;
}

function isEmployee({ session }: { session?: Session }) {
  if (!session) return false;

  if (session.data.role == "employee" || session.data.role == "admin" || session.data.role == "manager") return true;

  return !session.data.isBlocked;
}

function isUser({ session }: { session?: Session }) {
  if (!session) return false;

  if (session.data.role == "employee" || session.data.role == "admin" || session.data.role == "manager" || session.data.role == "customer") return true;

  return !session.data.isBlocked;
}

export const lists: Lists = {
  User: list({
    ui: {
      labelField: "name",
    },
    access: {
      operation: {
        query: isUser,
        create: isManager,
        update: isManager,
        delete: isAdmin,
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      username: text({ validation: { isRequired: true }, isIndexed: "unique" }),
      email: text({
        isIndexed: "unique",
      }),
      isBlocked: checkbox({ defaultValue: false }),
      phone: text(),
      role: select({
        type: "string",
        options: ["admin", "customer", "employee", "manager"],
        defaultValue: "customer",
        validation: { isRequired: true },
        isIndexed: true,
        access: {
          update: isAdmin,
        },
      }),
      permissions: multiselect({
        type: "enum",
        options: [
          { label: "Warranty", value: "warranty" },
          { label: "Price", value: "price" },
        ],
        access: {
          update: isAdmin,
        },
      }),
      ssid: text(),
      password: password({
        validation: {
          isRequired: true,
          length: {
            min: 6,
          },
        },
      }),
      operations: relationship({ ref: "Operation.creator", many: true }),
      notes: relationship({ ref: "Note.creator", many: true }),
      documents: relationship({ ref: "Document.creator", many: true }),
      customerDocuments: relationship({ ref: "Document.customer", many: true }),
      customerMovements: relationship({
        ref: "StockMovement.customer",
        many: true,
      }),
      extraFields: json(),
    },
  }),
  Note: list({
    ui: {
      labelField: "note",
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isAdmin,
        delete: isAdmin,
      },
    },
    fields: {
      note: text({ validation: { isRequired: true } }),
      creator: relationship({
        ref: "User.notes",
        many: false,
      }),
      extraFields: json(),
    },
  }),
  File: list({
    ui: {
      labelField: "name",
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isAdmin,
        delete: isAdmin,
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      url: text(),
      operation: relationship({
        ref: "Operation.files",
        many: false,
      }),
      material: relationship({
        ref: "Material.files",
        many: false,
      }),
      extraFields: json(),
    },
  }),
  Document: list({
    ui: {
      labelField: "createdAt",
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isManager,
        delete: isManager,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context }) => {
        if (operation === "delete") {
          const products = await context.query.DocumentProduct.findMany({
            where: { document: { id: { equals: item.id } } },
            query: "id",
          });
          products.forEach(async (dp) => {
            await context.query.DocumentProduct.deleteOne({
              where: { id: dp.id },
            });
          });
          if (item.paymentPlanId) {
            await context.query.PaymentPlan.deleteOne({
              where: { id: item.paymentPlanId },
            });
          }
        }
      },
    },
    fields: {
      createdAt: timestamp({
        defaultValue: { kind: "now" },
        isOrderable: true,
        access: {
          create: denyAll,
          update: denyAll,
        },
      }),
      total: virtual({
        field: graphql.field({
          type: graphql.Float,
          async resolve(item, args, context) {
            try {
              const materials = await context.query.DocumentProduct.findMany({
                where: { document: { id: { equals: item.id } } },
                query: "amount material { value }",
              });
              let total = 0;
              materials.forEach((docProd) => {
                total += docProd.amount * docProd.mat.value;
              });
              return total - (total * (item.reduction ?? 0)) / 100;
            } catch (e) {
              return 0;
            }
          },
        }),
      }),
      documentType: select({
        type: "string",
        options: ["teklif", "satış", "irsaliye", "fatura", "borç dekontu", "alacak dekontu"],
        defaultValue: "satış",
        validation: { isRequired: true },
      }),
      creator: relationship({
        ref: "User.documents",
        many: false,
        access: {
          update: denyAll,
        },
      }),
      customer: relationship({
        ref: "User.customerDocuments",
        many: false,
        access: {
          update: denyAll,
        },
      }),
      reduction: float({ defaultValue: 0 }),
      isDeleted: checkbox({ defaultValue: false }),
      fromDocument: relationship({
        ref: "Document.toDocument",
        many: false,
      }),
      toDocument: relationship({
        ref: "Document.fromDocument",
        many: false,
      }),
      products: relationship({
        ref: "DocumentProduct.document",
        many: true,
      }),
      payments: relationship({
        ref: "Payment.document",
        many: true,
      }),
      extraFields: json(),
    },
  }),
  DocumentProduct: list({
    ui: {
      labelField: "amount",
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context }) => {
        if (operation === "delete") {
          const movements = await context.query.StockMovement.findMany({
            where: { documentProduct: { id: { equals: item.id } } },
            query: "id",
          });
          movements.forEach(async (movement) => {
            await context.query.StockMovement.deleteOne({
              where: { id: movement.id },
            });
          });
        }
      },
      afterOperation: async ({ operation, item, context }) => {
        if (operation === "create") {
          const generalStorage = await context.query.Storage.findMany({
            where: { name: { equals: "Genel" } },
            query: "id",
          });
          await context.query.StockMovement.createOne({
            data: {
              product: { connect: { id: item.productId } },
              storage: { connect: { id: generalStorage.at(0)!.id } },
              amount: item.amount,
              movementType: "çıkış",
              documentProduct: { connect: { id: item.id } },
            },
          });
        }
      },
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isEmployee,
        delete: isManager,
      },
    },
    fields: {
      amount: float({ validation: { isRequired: true, min: 1 } }),
      stockMovements: relationship({
        ref: "StockMovement.documentProduct",
        many: true,
      }),
      product: relationship({
        ref: "Material.documentProducts",
        many: false,
      }),
      price: float({ validation: { isRequired: true, min: 0 } }),
      total: virtual({
        field: graphql.field({
          type: graphql.Float,
          async resolve(item, args, context) {
            try {
              const document = await context.query.Document.findOne({
                where: { id: item.documentId },
                query: "reduction",
              });
              let total = item.price * item.amount;

              total -= (total * (document.reduction ?? 0)) / 100;
              return total;
            } catch (e) {
              return 0;
            }
          },
        }),
      }),
      document: relationship({
        ref: "Document.products",
        many: false,
      }),
      extraFields: json(),
    },
  }),
  Operation: list({
    ui: {
      labelField: "name",
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context }) => {
        if (operation === "update") {
          if (inputData.startedAt) {
            if (item.finishedAt) {
              throw new Error("Application already finished");
            }
          }
          if (inputData.finishedAt) {
            if (!item.startedAt) {
              throw new Error("Application not started");
            }
            if (item.finishedAt) {
              throw new Error("Application already finished");
            }
            if (inputData.finishedAt < item.startedAt) {
              throw new Error("Finish date cannot be before start date");
            }
          }
          if (inputData.wastage && inputData.wastage > (item.wastage ?? 0)) {
            const generalStorage = await context.query.Storage.findMany({
              where: { name: { equals: "Genel" } },
              query: "id",
            });
            const wastageStorage = await context.query.Storage.findMany({
              where: { name: { equals: "Fire" } },
              query: "id",
            });
            await context.query.StockMovement.createOne({
              data: {
                product: { connect: { id: item.productId } },
                storage: { connect: { id: wastageStorage.at(0)!.id } },
                amount: inputData.wastage - (item.wastage ?? 0),
                movementType: "giriş",
                application: { connect: { id: item.id } },
              },
            });
            await context.query.StockMovement.createOne({
              data: {
                product: { connect: { id: item.productId } },
                storage: { connect: { id: generalStorage.at(0)!.id } },
                amount: inputData.wastage - (item.wastage ?? 0),
                movementType: "çıkış",
                application: { connect: { id: item.id } },
              },
            });
          } else if (inputData.wastage && item.wastage && inputData.wastage < item.wastage) {
            const generalStorage = await context.query.Storage.findMany({
              where: { name: { equals: "Genel" } },
              query: "id",
            });
            const wastageStorage = await context.query.Storage.findMany({
              where: { name: { equals: "Fire" } },
              query: "id",
            });
            await context.query.StockMovement.createOne({
              data: {
                product: { connect: { id: item.productId } },
                storage: { connect: { id: wastageStorage.at(0)!.id } },
                amount: item.wastage - inputData.wastage,
                movementType: "çıkış",
                application: { connect: { id: item.id } },
              },
            });
            await context.query.StockMovement.createOne({
              data: {
                product: { connect: { id: item.productId } },
                storage: { connect: { id: generalStorage.at(0)!.id } },
                amount: item.wastage - inputData.wastage,
                movementType: "giriş",
                application: { connect: { id: item.id } },
              },
            });
          }
        } else if (operation === "delete") {
          const movements = await context.query.StockMovement.findMany({
            where: { application: { id: { equals: item.id } } },
            query: "id",
          });
          movements.forEach(async (movement) => {
            await context.query.StockMovement.deleteOne({
              where: { id: movement.id },
            });
          });
        }
      },
      afterOperation: async ({ operation, item, context }) => {
        if (operation === "create") {
          const generalStorage = await context.query.Storage.findMany({
            where: { name: { equals: "Genel" } },
            query: "id",
          });
          await context.query.StockMovement.createOne({
            data: {
              product: { connect: { id: item.productId } },
              storage: { connect: { id: generalStorage.at(0)!.id } },
              amount: item.amount,
              movementType: "çıkış",
              application: { connect: { id: item.id } },
            },
          });
        }
      },
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isEmployee,
        delete: isEmployee,
      },
    },
    fields: {
      files: relationship({
        ref: "File.operation",
        many: true,
      }),
      startedAt: timestamp(),
      finishedAt: timestamp(),
      name: text({ validation: { isRequired: true } }),
      description: text(),
      value: float({ validation: { isRequired: true, min: 0 } }),
      price: virtual({
        field: graphql.field({
          type: graphql.Float,
          async resolve(item, args, context) {
            try {
              const workOrder = await context.query.WorkOrder.findOne({
                where: { id: item.workOrderId },
                query: "reduction",
              });
              let total = item.value;

              total -= (total * (workOrder.reduction ?? 0)) / 100;
              return total;
            } catch (e) {
              return 0;
            }
          },
        }),
      }),
      amount: float({ validation: { isRequired: true, min: 0 } }),
      wastage: float({
        validation: { min: 0 },
        defaultValue: 0,
      }),
      material: relationship({
        ref: "Material.operations",
        many: false,
      }),
      creator: relationship({
        ref: "User.operations",
        many: false,
      }),
      extraFields: json(),
    },
  }),
  Material: list({
    ui: {
      labelField: "name",
    },
    access: {
      operation: {
        create: isManager,
        query: isUser,
        update: isManager,
        delete: isManager,
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      description: text(),
      price: float({ validation: { isRequired: true, min: 0 } }),
      currentStock: virtual({
        field: graphql.field({
          type: graphql.Int,
          async resolve(item, args, context) {
            try {
              const generalStorage = await context.query.Storage.findMany({
                where: { name: { equals: "Genel" } },
                query: "id",
              });
              const movements = await context.query.StockMovement.findMany({
                where: {
                  product: { id: { equals: item.id } },
                  storage: { id: { equals: generalStorage.at(0)!.id } },
                },
                query: "amount movementType",
              });
              let stock = 0;
              movements.forEach((movement) => {
                if (movement.movementType == "giriş") {
                  stock += movement.amount;
                } else {
                  stock -= movement.amount;
                }
              });
              return stock;
            } catch (e) {
              return 0;
            }
          },
        }),
      }),
      status: select({
        type: "string",
        options: ["aktif", "pasif", "iptal"],
        defaultValue: "aktif",
        validation: { isRequired: true },
      }),
      files: relationship({
        ref: "File.material",
        many: true,
      }),
      code: text(),
      ean: text(),
      brand: relationship({
        ref: "Brand.materials",
        many: false,
      }),
      suppliers: relationship({
        ref: "Supplier.materials",
        many: true,
      }),
      pricedBy: select({
        type: "string",
        options: ["amount", "length(mm)", "weight(g)", "area(m²)"],
        defaultValue: "amount",
        validation: { isRequired: true },
      }),
      operations: relationship({
        ref: "Operation.material",
        many: true,
      }),
      stockMovements: relationship({
        ref: "StockMovement.material",
        many: true,
      }),
      documentProducts: relationship({
        ref: "DocumentProduct.product",
        many: true,
      }),
      extraFields: json(),
    },
  }),
  Storage: list({
    ui: {
      labelField: "name",
    },
    access: {
      operation: {
        create: isAdmin,
        query: isEmployee,
        update: isAdmin,
        delete: isAdmin,
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      stockMovements: relationship({
        ref: "StockMovement.storage",
        many: true,
      }),
      extraFields: json(),
    },
  }),
  StockMovement: list({
    ui: {
      labelField: "movementType",
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isAdmin,
        delete: isAdmin,
      },
    },
    fields: {
      material: relationship({
        ref: "Material.stockMovements",
        many: false,
      }),
      storage: relationship({
        ref: "Storage.stockMovements",
        many: false,
      }),
      amount: float({ validation: { isRequired: true, min: 0 } }),
      movementType: select({
        type: "string",
        options: ["giriş", "çıkış"],
        defaultValue: "giriş",
        validation: { isRequired: true },
      }),
      documentProduct: relationship({
        ref: "DocumentProduct.stockMovements",
        many: false,
      }),
      note: text(),
      customer: relationship({
        ref: "User.customerMovements",
        many: false,
      }),
      date: timestamp({
        defaultValue: { kind: "now" },
        isOrderable: true,
      }),
      createdAt: timestamp({
        defaultValue: { kind: "now" },
        isOrderable: true,
        access: {
          create: denyAll,
          update: denyAll,
        },
      }),
      extraFields: json(),
    },
  }),
  Supplier: list({
    ui: {
      labelField: "name",
    },
    access: {
      operation: {
        create: isManager,
        query: isUser,
        update: isManager,
        delete: isAdmin,
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      materials: relationship({ ref: "Material.suppliers", many: true }),
      extraFields: json(),
    },
  }),
  Brand: list({
    ui: {
      labelField: "name",
    },
    access: {
      operation: {
        create: isEmployee,
        query: isUser,
        update: isEmployee,
        delete: isAdmin,
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      materials: relationship({ ref: "Material.brand", many: true }),
      extraFields: json(),
    },
  }),
  Payment: list({
    ui: {
      labelField: "timestamp",
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isManager,
        delete: isManager,
      },
    },
    fields: {
      amount: float({ validation: { isRequired: true, min: 0 } }),
      document: relationship({
        ref: "Document.payments",
        many: false,
      }),
      out: virtual({
        field: graphql.field({
          type: graphql.Boolean,
          async resolve(item, args, context) {
            try {
              const document = await context.query.Document.findOne({
                where: { id: item.documentId },
                query: "type",
              });
              switch (document.type) {
                case "satış":
                  return false;
                case "irsaliye":
                  return false;
                case "fatura":
                  return false;
                case "borç dekontu":
                  return false;
                case "alacak dekontu":
                  return true;
                default:
                  return false;
              }
            } catch (e) {
              return false;
            }
          },
        }),
      }),
      reference: text(),
      type: select({
        type: "string",
        options: ["nakit", "kredi kartı", "havale", "çek", "senet", "banka kartı", "kredi"],
        defaultValue: "nakit",
        validation: { isRequired: true },
      }),
      timestamp: timestamp({
        defaultValue: { kind: "now" },
        isOrderable: true,
      }),
      extraFields: json(),
    },
  }),
  Notification: list({
    ui: {
      labelField: "date",
    },
    access: {
      operation: {
        create: isAdmin,
        query: isUser,
        update: isAdmin,
        delete: isAdmin,
      },
    },
    fields: {
      date: timestamp({
        defaultValue: { kind: "now" },
        isOrderable: true,
      }),
      message: text({ validation: { isRequired: true } }),
      link: text(),
      handled: checkbox({ defaultValue: false }),
      notifyRoles: multiselect({
        type: "enum",
        options: ["admin", "customer", "employee", "manager"],
      }),
    },
  }),
  SoftwareVersion: list({
    isSingleton: true,
    access: {
      operation: {
        create: isAdmin,
        query: isUser,
        update: isAdmin,
        delete: isAdmin,
      },
    },
    fields: {
      version: integer({ validation: { isRequired: true } }),
      iosLink: text(),
      androidLink: text(),
      webLink: text(),
      windowsLink: text(),
      macLink: text(),
      date: timestamp({
        defaultValue: { kind: "now" },
        isOrderable: true,
      }),
    },
  }),
  Config: list({
    isSingleton: true,
    access: {
      operation: {
        create: () => false,
        query: isUser,
        update: isAdmin,
        delete: () => false,
      },
    },
    ui: {
      labelField: "name",
    },
    fields: {
      defaultCurrency: text({ defaultValue: "TRY" }),
      extraFieldsProduct: json(),
    },
  }),
};
