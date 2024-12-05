import { text, relationship, password, timestamp, select, multiselect, virtual, checkbox, integer, json, decimal } from "@keystone-6/core/fields";
import { allowAll, denyAll } from "@keystone-6/core/access";
import { graphql, list } from "@keystone-6/core";
import type { Lists } from ".keystone/types";
import {
  calculateTotalWithoutTaxAfterReduction,
  calculateTotalWithoutTaxBeforeReduction,
  calculateTotalWithTaxAfterReduction,
  calculateTotalWithTaxBeforeReduction,
} from "./utils/calculations/documentproducts";
import {
  isAdminAccountantManager,
  isWorker,
  isCompanyAdmin,
  isGlobalAdmin,
  isEmployee,
  isManager,
  isUser,
  isSuperAdmin,
  isAdminAccountantIntern,
} from "./functions";
import { Decimal } from "@keystone-6/core/types";

interface MaterialStock {
  shelfStocks: ShelfStock[];
}

interface ShelfStock {
  location: string;
  shelfId: string;
  expiration: Date | null;
  amount: number;
}

interface ShelfContents {
  materialContents: MaterialContent[];
}

interface MaterialContent {
  name: string;
  materialId: string;
  expiration: Date | null;
  amount: number;
}

const companyFilter = ({ session }: { session?: any }) => {
  if (isGlobalAdmin({ session })) {
    return {};
  } else {
    return { company: { id: { equals: session.data.company.id } } };
  }
};
export const lists: Lists = {
  Accountancy: list({
    access: {
      operation: {
        create: isSuperAdmin,
        query: isAdminAccountantIntern,
        update: isAdminAccountantManager,
        delete: isSuperAdmin,
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      isActive: checkbox({ defaultValue: false, access: { update: isAdminAccountantManager } }),
      logo: relationship({
        ref: "File",
        many: false,
      }),
      companies: relationship({ ref: "Company.accountancy", many: true }),
      users: relationship({ ref: "User.accountancy", many: true }),
      extraFields: json(),
    },
  }),
  Address: list({
    ui: {
      labelField: "street",
    },
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isUser,
        query: isUser,
        update: isEmployee,
        delete: isSuperAdmin,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, resolvedData, context }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      street: text({ validation: { isRequired: true } }),
      door: text(),
      zip: text(),
      city: text(),
      floor: text(),
      province: text(),
      country: text(),
      customer: relationship({
        ref: "User.customerAddresses",
        many: false,
      }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
  AssemblyComponent: list({
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isManager,
        query: isEmployee,
        update: isManager,
        delete: isManager,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      description: text(),
      amount: integer(),
      assembly: relationship({
        ref: "Material.components",
        many: false,
      }),
      material: relationship({
        ref: "Material.assemblyComponents",
        many: false,
      }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
  Brand: list({
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isEmployee,
        query: isUser,
        update: isEmployee,
        delete: isGlobalAdmin,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      materials: relationship({ ref: "Material.brand", many: true }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
  Company: list({
    access: {
      operation: {
        create: isAdminAccountantManager,
        query: isWorker,
        update: isCompanyAdmin,
        delete: denyAll,
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      isActive: checkbox({ defaultValue: false, access: { update: isAdminAccountantManager } }),
      logo: relationship({
        ref: "File",
        many: false,
      }),
      pincode: text({ validation: { isRequired: true }, isIndexed: "unique" }),
      owner: relationship({
        ref: "User.ownedCompany",
        many: false,
      }),
      users: relationship({ ref: "User.company", many: true }),
      establishments: relationship({ ref: "Establishment.company", many: true }),
      accountancy: relationship({ ref: "Accountancy.companies", many: false }),
      extraFields: json(),
      emailUser: text(),
      emailPassword: text(),
      emailHost: text(),
      emailPort: text(),
      emailSec: text(),
      stripeSecretKey: text(),
      stripePublishableKey: text(),
      bolClientID: text(),
      bolClientSecret: text(),
      amazonClientID: text(),
      amazonClientSecret: text(),
      accountantEmail: text(),
      monthlyReports: checkbox({ defaultValue: false }),
    },
  }),
  Document: list({
    ui: {
      labelField: "date",
    },
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isManager,
        delete: isManager,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, resolvedData, context }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }

        try {
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
          }
          if (operation === "create") {
            if (inputData.type == "purchase" && inputData.number) {
              return;
            } else {
              const docs = await context.query.Document.findMany({
                orderBy: { number: "desc" },
                where: { type: { equals: inputData.type } },
                query: "id number",
              });
              const lastDocument = docs.at(0);
              if (lastDocument) {
                const lastNumber = lastDocument.number.split("-")[1];
                const lastYear = lastDocument.number.split("-")[0];
                if (lastYear == new Date().getFullYear()) {
                  resolvedData.number = `${lastYear}-${(parseInt(lastNumber) + 1).toFixed(0).padStart(7, "0")}`;
                } else {
                  resolvedData.number = `${new Date().getFullYear()}-${(1).toFixed(0).padStart(7, "0")}`;
                }
              } else {
                resolvedData.number = `${new Date().getFullYear()}-${(1).toFixed(0).padStart(7, "0")}`;
              }
            }
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      date: timestamp({
        defaultValue: { kind: "now" },
        isOrderable: true,
        access: {
          update: isEmployee,
        },
      }),
      deliveryDate: timestamp({
        isOrderable: true,
        access: {
          update: isEmployee,
        },
      }),
      createdAt: timestamp({
        defaultValue: { kind: "now" },
        isOrderable: true,
        access: {
          create: denyAll,
          update: denyAll,
        },
      }),
      type: select({
        type: "string",
        options: ["quote", "sale", "dispatch", "invoice", "credit_note", "debit_note", "purchase"],
        validation: { isRequired: true },
      }),
      currency: select({
        type: "string",
        options: ["TRY", "USD", "EUR"],
        defaultValue: "EUR",
        validation: { isRequired: true },
        access: {
          update: isCompanyAdmin,
        },
      }),
      creator: relationship({
        ref: "User.documents",
        many: false,
        access: {
          update: denyAll,
        },
      }),
      supplier: relationship({
        ref: "Supplier.documents",
        many: false,
      }),
      customer: relationship({
        ref: "User.customerDocuments",
        many: false,
        access: {
          update: denyAll,
        },
      }),
      files: relationship({
        ref: "File",
        many: true,
      }),
      isDeleted: checkbox({ defaultValue: false }),
      fromDocument: relationship({
        ref: "Document.toDocument",
        many: false,
      }),
      delAddress: relationship({
        ref: "Address",
        many: false,
      }),
      docAddress: relationship({
        ref: "Address",
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
      prefix: text(),
      phase: integer(),
      number: text({ validation: { isRequired: true } }),
      total: virtual({
        field: graphql.field({
          type: graphql.Decimal,
          async resolve(item, args, context): Promise<Decimal> {
            try {
              const materials = await context.query.DocumentProduct.findMany({
                where: { document: { id: { equals: item.id } } },
                query: "price amount reduction tax",
              });
              let total = 0;
              materials.forEach((docProd) => {
                total += calculateTotalWithTaxAfterReduction({
                  price: docProd.price,
                  amount: docProd.amount,
                  reduction: docProd.reduction ?? 0,
                  tax: docProd.tax,
                  taxIncluded: item.taxIncluded,
                });
              });
              return new Decimal(total);
            } catch (e) {
              return new Decimal(0);
            }
          },
        }),
      }),
      totalPaid: virtual({
        field: graphql.field({
          type: graphql.Decimal,
          async resolve(item, args, context): Promise<Decimal> {
            try {
              const payments = await context.query.Payment.findMany({
                where: { document: { some: { id: { equals: item.id } } }, isDeleted: { equals: false } },
                query: "value",
              });
              let total = 0;
              payments.forEach((payment) => {
                total += payment.value;
              });
              return new Decimal(total);
            } catch (e) {
              return new Decimal(0);
            }
          },
        }),
      }),
      totalToPay: virtual({
        field: graphql.field({
          type: graphql.Decimal,
          async resolve(item, args, context): Promise<Decimal> {
            try {
              const materials = await context.query.DocumentProduct.findMany({
                where: { document: { id: { equals: item.id } } },
                query: "price amount reduction tax",
              });
              let totalValue = 0;
              materials.forEach((docProd) => {
                totalValue += calculateTotalWithTaxAfterReduction({
                  price: docProd.price,
                  amount: docProd.amount,
                  reduction: docProd.reduction ?? 0,
                  tax: docProd.tax,
                  taxIncluded: item.taxIncluded,
                });
              });
              const payments = await context.query.Payment.findMany({
                where: { document: { some: { id: { equals: item.id } } }, isDeleted: { equals: false } },
                query: "value",
              });
              let totalPaid = 0;
              payments.forEach((payment) => {
                totalPaid += payment.value;
              });
              let total = totalValue - totalPaid;
              if (total < 0.02 && total > -0.02) {
                total = 0;
              }
              return new Decimal(total);
            } catch (e) {
              return new Decimal(0);
            }
          },
        }),
      }),
      comments: text(),
      references: text(),
      managerNotes: text(),
      establishment: relationship({ ref: "Establishment.documents", many: false }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      taxIncluded: checkbox({ defaultValue: true }),
      extraFields: json(),
    },
  }),
  DocumentProduct: list({
    ui: {
      labelField: "amount",
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
        try {
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
        } catch (error) {
          console.error(error);
        }
      },
      afterOperation: async ({ operation, item, context }) => {
        // if (operation === "create") {
        //   const generalStorage = await context.query.Storage.findMany({
        //     where: { name: { equals: "Genel" } },
        //     query: "id",
        //   });
        //   await context.query.StockMovement.createOne({
        //     data: {
        //       material: { connect: { id: item.productId } },
        //       storage: { connect: { id: generalStorage.at(0)!.id } },
        //       amount: item.amount,
        //       movementType: "çıkış",
        //       documentProduct: { connect: { id: item.id } },
        //     },
        //   });
        // }
      },
    },
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isEmployee,
        delete: isManager,
      },
    },
    fields: {
      amount: decimal({ validation: { isRequired: true, min: "1" } }),
      stockMovements: relationship({
        ref: "StockMovement.documentProduct",
        many: true,
      }),
      product: relationship({
        ref: "Material.documentProducts",
        many: false,
      }),
      name: text({ validation: { isRequired: true } }),
      description: text(),
      tax: decimal({ validation: { isRequired: true, min: "0" } }),
      price: decimal({ validation: { isRequired: true, min: "0" } }),
      reduction: decimal({ defaultValue: "0" }),
      totalWithoutTaxBeforeReduction: virtual({
        field: graphql.field({
          type: graphql.Decimal,
          async resolve(item, args, context): Promise<Decimal> {
            try {
              let taxIncluded = true;
              await context.query.Document.findOne({
                where: { id: item.documentId },
                query: "taxIncluded",
              }).then((res) => (taxIncluded = res.taxIncluded));
              return new Decimal(
                calculateTotalWithoutTaxBeforeReduction({
                  price: Number(item.price),
                  amount: Number(item.amount),
                  tax: Number(item.tax),
                  taxIncluded,
                })
              );
            } catch (e) {
              return new Decimal(0);
            }
          },
        }),
      }),
      totalWithoutTaxAfterReduction: virtual({
        field: graphql.field({
          type: graphql.Decimal,
          async resolve(item, args, context): Promise<Decimal> {
            try {
              let taxIncluded = true;
              await context.query.Document.findOne({
                where: { id: item.documentId },
                query: "taxIncluded",
              }).then((res) => (taxIncluded = res.taxIncluded));
              return new Decimal(
                calculateTotalWithoutTaxAfterReduction({
                  price: Number(item.price),
                  amount: Number(item.amount),
                  tax: Number(item.tax),
                  reduction: Number(item.reduction) ?? 0,
                  taxIncluded,
                })
              );
            } catch (e) {
              return new Decimal(0);
            }
          },
        }),
      }),
      totalWithTaxBeforeReduction: virtual({
        field: graphql.field({
          type: graphql.Decimal,
          async resolve(item, args, context): Promise<Decimal> {
            try {
              let taxIncluded = true;
              await context.query.Document.findOne({
                where: { id: item.documentId },
                query: "taxIncluded",
              }).then((res) => (taxIncluded = res.taxIncluded));
              return new Decimal(
                calculateTotalWithTaxBeforeReduction({
                  price: Number(item.price),
                  amount: Number(item.amount),
                  tax: Number(item.tax),
                  taxIncluded,
                })
              );
            } catch (e) {
              return new Decimal(0);
            }
          },
        }),
      }),
      totalWithTaxAfterReduction: virtual({
        field: graphql.field({
          type: graphql.Decimal,
          async resolve(item, args, context): Promise<Decimal> {
            try {
              let taxIncluded = true;
              await context.query.Document.findOne({
                where: { id: item.documentId },
                query: "taxIncluded",
              }).then((res) => (taxIncluded = res.taxIncluded));
              return new Decimal(
                calculateTotalWithTaxAfterReduction({
                  price: Number(item.price),
                  amount: Number(item.amount),
                  tax: Number(item.tax),
                  reduction: Number(item.reduction) ?? 0,
                  taxIncluded,
                })
              );
            } catch (e) {
              return new Decimal(0);
            }
          },
        }),
      }),
      totalTax: virtual({
        field: graphql.field({
          type: graphql.Decimal,
          async resolve(item, args, context): Promise<Decimal> {
            try {
              let taxIncluded = true;
              await context.query.Document.findOne({
                where: { id: item.documentId },
                query: "taxIncluded",
              }).then((res) => (taxIncluded = res.taxIncluded));
              return new Decimal(
                calculateTotalWithoutTaxAfterReduction({
                  price: Number(item.price),
                  amount: Number(item.amount),
                  tax: Number(item.tax),
                  reduction: Number(item.reduction) ?? 0,
                  taxIncluded,
                })
              );
            } catch (e) {
              return new Decimal(0);
            }
          },
        }),
      }),
      totalReduction: virtual({
        field: graphql.field({
          type: graphql.Decimal,
          async resolve(item, args, context): Promise<Decimal> {
            try {
              let taxIncluded = true;
              await context.query.Document.findOne({
                where: { id: item.documentId },
                query: "taxIncluded",
              }).then((res) => (taxIncluded = res.taxIncluded));
              return new Decimal(
                calculateTotalWithoutTaxBeforeReduction({
                  price: Number(item.price),
                  amount: Number(item.amount),
                  tax: Number(item.tax),
                  taxIncluded,
                })
              );
            } catch (e) {
              return new Decimal(0);
            }
          },
        }),
      }),
      document: relationship({
        ref: "Document.products",
        many: false,
      }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
  Establishment: list({
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isAdminAccountantManager,
        query: isWorker,
        update: isCompanyAdmin,
        delete: isGlobalAdmin,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      defaultCurrency: text({ defaultValue: "EUR" }),
      logo: relationship({
        ref: "File",
        many: false,
      }),
      phone: text(),
      phone2: text(),
      taxID: text(),
      bankAccount1: text(),
      bankAccount2: text(),
      bankAccount3: text(),
      shelves: relationship({ ref: "Shelf.establishment", many: true }),
      users: relationship({ ref: "User.establishment", many: true }),
      address: relationship({ ref: "Address", many: false }),
      documents: relationship({ ref: "Document.establishment", many: true }),
      company: relationship({ ref: "Company.establishments", many: false }),
      featureFlags: json({
        defaultValue: {
          documents: true,
          stock: true,
          drive: true,
        },
      }),
      extraFields: json(),
    },
  }),
  File: list({
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isSuperAdmin,
        delete: isSuperAdmin,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      url: text(),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
  Material: list({
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isManager,
        query: isUser,
        update: isManager,
        delete: isManager,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      components: relationship({
        ref: "AssemblyComponent.assembly",
        many: true,
      }),
      assemblyComponents: relationship({
        ref: "AssemblyComponent.material",
        many: true,
      }),
      description: text(),
      price: decimal({ validation: { isRequired: true, min: "0" } }),
      currentStock: virtual({
        field: graphql.field({
          type: graphql.Decimal,
          async resolve(item, args, context) {
            try {
              let stock = 0;
              if (!item.stock) {
                return new Decimal(0);
              }
              if (!item.stock.shelfStocks) {
                return new Decimal(0);
              }
              if (item.stock.shelfStocks.length === 0) {
                return new Decimal(0);
              }
              stock = item.stock.shelfStocks.reduce((acc: number, s: ShelfStock) => {
                acc += s.amount;
                return acc;
              }, 0);

              return new Decimal(stock);
            } catch (e) {
              return new Decimal(0);
            }
          },
        }),
      }),
      status: select({
        type: "string",
        options: ["active", "passive", "cancelled"],
        defaultValue: "active",
        validation: { isRequired: true },
      }),
      files: relationship({
        ref: "File",
        many: true,
      }),
      workOrders: relationship({
        ref: "WorkOrder.materials",
        many: true,
      }),
      code: text(),
      ean: text(),
      tax: decimal({ defaultValue: "21", validation: { isRequired: true, min: "0" } }),
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
        options: ["amount", "volume", "length", "weight", "area"],
        defaultValue: "amount",
        validation: { isRequired: true },
      }),
      type: select({
        type: "string",
        options: ["raw", "product", "assembly", "service"],
        defaultValue: "product",
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
      stock: json(),
      earliestExpiration: timestamp(),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
  Note: list({
    ui: {
      labelField: "note",
    },
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: denyAll,
        delete: denyAll,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      note: text({ validation: { isRequired: true } }),
      creator: relationship({
        ref: "User.notes",
        many: false,
      }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
  Notification: list({
    ui: {
      labelField: "date",
    },
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isGlobalAdmin,
        query: isUser,
        update: isGlobalAdmin,
        delete: isGlobalAdmin,
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
        options: [
          "superadmin",
          "global_admin",
          "owner",
          "company_admin",
          "general_manager",
          "manager",
          "accountant",
          "employee",
          "intern",
          "worker",
          "customer",
        ],
      }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
    },
  }),
  Operation: list({
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isEmployee,
        delete: isEmployee,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      files: relationship({
        ref: "File",
        many: true,
      }),
      material: relationship({
        ref: "Material.operations",
        many: false,
      }),
      workOrderOperations: relationship({
        ref: "WorkOrderOperation.operation",
        many: true,
      }),
      user: relationship({ ref: "User.operations", many: false }),
      cost: decimal(),
      value: decimal({ validation: { isRequired: true, min: "0" } }),
      duration: integer(),
      description: text(),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
  Payment: list({
    ui: {
      labelField: "timestamp",
    },
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isManager,
        delete: isCompanyAdmin,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      value: decimal({ validation: { isRequired: true, min: "0" } }),
      document: relationship({
        ref: "Document.payments",
        many: true,
      }),
      out: virtual({
        field: graphql.field({
          type: graphql.Boolean,
          async resolve(item, args, context) {
            try {
              const document = await context.query.Document.findMany({
                where: {
                  payments: {
                    some: {
                      id: {
                        equals: item.id,
                      },
                    },
                  },
                },
                query: "type",
              });
              switch (document[0].type) {
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
                case "satın alma":
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
      isDeleted: checkbox({ defaultValue: false }),
      isVerified: checkbox({ defaultValue: false }),
      creator: relationship({
        ref: "User.payments",
        many: false,
      }),
      reference: text(),
      type: select({
        type: "string",
        options: ["cash", "debit_card", "credit_card", "online", "bank_transfer", "financing", "financing_unverified", "promissory"],
        defaultValue: "cash",
        validation: { isRequired: true },
      }),
      timestamp: timestamp({
        defaultValue: { kind: "now" },
        isOrderable: true,
      }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
  Shelf: list({
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isCompanyAdmin,
        query: isEmployee,
        update: isCompanyAdmin,
        delete: isGlobalAdmin,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      x: text(),
      y: text(),
      z: text(),
      contents: json(),
      establishment: relationship({
        ref: "Establishment.shelves",
        many: false,
      }),
      stockMovements: relationship({
        ref: "StockMovement.shelf",
        many: true,
      }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
  SoftwareVersion: list({
    isSingleton: true,
    access: {
      operation: {
        create: isSuperAdmin,
        query: allowAll,
        update: isSuperAdmin,
        delete: denyAll,
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
  StockMovement: list({
    ui: {
      labelField: "movementType",
    },
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isEmployee,
        delete: isSuperAdmin,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
      afterOperation: async ({ operation, context, item }) => {
        if (operation === "create") {
          const material = await context.query.Material.findOne({
            where: { id: item.materialId },
            query: "id stock name",
          });
          const shelf = await context.query.Shelf.findOne({
            where: { id: item.shelfId },
            query: "id contents x y z",
          });

          console.log(material);
          console.log(shelf);

          let newMaterialStock: MaterialStock = material.stock ?? { shelfStocks: [] };

          // if material.stock does not include any stock with the same expiration date and shelf add it, otherwise update the amount based on the movement type (in or out)
          if (!newMaterialStock.shelfStocks.find((s: ShelfStock) => s.expiration === item.expiration && s.shelfId === item.shelfId)) {
            newMaterialStock.shelfStocks.push({
              shelfId: item.shelfId!,
              expiration: item.expiration,
              amount: Number(item.amount),
              location: shelf.x + `-` + shelf.y + `-` + shelf.z,
            });
          } else {
            const existingShelfStock = newMaterialStock.shelfStocks.find((s: ShelfStock) => s.expiration === item.expiration && s.shelfId === item.shelfId);
            if (item.movementType == "in") {
              existingShelfStock!.amount += Number(item.amount);
            } else if (item.movementType == "out") {
              existingShelfStock!.amount -= Number(item.amount);
              if (existingShelfStock!.amount < 0) {
                // remove the shelfStock from the material.stock
                newMaterialStock.shelfStocks = newMaterialStock.shelfStocks.filter((s: ShelfStock) => s.expiration !== item.expiration);
              }
            }
          }
          console.log(newMaterialStock);

          let newEarliestExpiration: Date | null = null;

          if (newMaterialStock.shelfStocks.length > 0) {
            newMaterialStock.shelfStocks.sort((a: ShelfStock, b: ShelfStock) => {
              if (!a.expiration || !b.expiration) {
                return 1;
              } else if (a.expiration < b.expiration) {
                return -1;
              } else if (a.expiration > b.expiration) {
                return 1;
              } else {
                return 0;
              }
            });
            newEarliestExpiration = newMaterialStock.shelfStocks[0].expiration;
          }

          console.log(newEarliestExpiration);

          context.query.Material.updateOne({
            where: { id: material.id },
            data: { earliestExpiration: newEarliestExpiration, stock: newMaterialStock },
          });

          let newShelfContents: ShelfContents = shelf.contents ?? { materialContents: [] };

          // if shelf.contents does not include any contents with the same expiration date add it, otherwise update the amount based on the movement type (in or out)
          if (!newShelfContents.materialContents.find((c: MaterialContent) => c.expiration === item.expiration)) {
            newShelfContents.materialContents.push({
              name: material.name,
              materialId: item.materialId!,
              expiration: item.expiration,
              amount: Number(item.amount),
            });
          } else {
            const existingMaterialContent = newShelfContents.materialContents.find((c: MaterialContent) => c.expiration === item.expiration);
            if (item.movementType == "in") {
              existingMaterialContent!.amount += Number(item.amount);
            } else if (item.movementType == "out") {
              existingMaterialContent!.amount -= Number(item.amount);
              if (existingMaterialContent!.amount < 0) {
                // remove the materialContent from the shelf.contents
                newShelfContents.materialContents = newShelfContents.materialContents.filter((c: MaterialContent) => c.expiration !== item.expiration);
              }
            }
          }

          console.log(newShelfContents);

          context.query.Shelf.updateOne({
            where: { id: shelf.id },
            data: { contents: newShelfContents },
          });
        }
      },
    },
    fields: {
      material: relationship({
        ref: "Material.stockMovements",
        many: false,
      }),
      amount: decimal({ validation: { isRequired: true, min: "0" } }),
      movementType: select({
        type: "string",
        options: ["in", "out"],
        defaultValue: "in",
        validation: { isRequired: true },
      }),
      expiration: timestamp(),
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
      shelf: relationship({
        ref: "Shelf.stockMovements",
        many: false,
      }),
      createdAt: timestamp({
        defaultValue: { kind: "now" },
        isOrderable: true,
        access: {
          create: denyAll,
          update: denyAll,
        },
      }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
  Supplier: list({
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isManager,
        query: isUser,
        update: isManager,
        delete: isGlobalAdmin,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      materials: relationship({ ref: "Material.suppliers", many: true }),
      documents: relationship({ ref: "Document.supplier", many: true }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      address: relationship({ ref: "Address", many: false }),
      taxId: text(),
      extraFields: json(),
    },
  }),
  User: list({
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        query: isUser,
        create: isManager,
        update: isManager,
        delete: isGlobalAdmin,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
        try {
          if (operation === "create") {
            if (!resolvedData.company) {
              throw new Error("Company is required");
            }
            let mail = inputData.email!;

            let mailPart1 = mail.split("@")[0];
            let mailPart2 = mail.split("@")[1];
            resolvedData.email = mailPart1 + "+" + resolvedData.company?.connect?.id + "@" + mailPart2;
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      email: text({
        isIndexed: "unique",
        validation: { isRequired: true },
      }),
      isBlocked: checkbox({ defaultValue: false }),
      phone: text(),
      role: select({
        type: "string",
        options: [
          "superadmin",
          "global_admin",
          "owner",
          "company_admin",
          "general_manager",
          "manager",
          "accountant",
          "employee",
          "intern",
          "worker",
          "customer",
        ],
        defaultValue: "customer",
        validation: { isRequired: true },
        isIndexed: true,
        access: {
          update: isCompanyAdmin,
        },
      }),
      permissions: multiselect({
        type: "enum",
        options: [
          { label: "Warranty", value: "warranty" },
          { label: "Price", value: "price" },
        ],
        access: {
          update: isCompanyAdmin,
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
      operations: relationship({ ref: "Operation.user", many: true }),
      notes: relationship({ ref: "Note.creator", many: true }),
      documents: relationship({ ref: "Document.creator", many: true }),
      customerDocuments: relationship({ ref: "Document.customer", many: true }),
      customerMovements: relationship({
        ref: "StockMovement.customer",
        many: true,
      }),
      preferredLanguage: text(),
      customerCompany: text(),
      firstName: text(),
      lastName: text(),
      customerTaxNumber: text(),
      customerTaxCenter: text(),
      payments: relationship({ ref: "Payment.creator", many: true }),
      customerAddresses: relationship({ ref: "Address.customer", many: true }),
      workOrders: relationship({ ref: "WorkOrder.creator", many: true }),
      establishment: relationship({ ref: "Establishment.users", many: false }),
      accountancy: relationship({ ref: "Accountancy.users", many: false }),
      ownedCompany: relationship({ ref: "Company.owner", many: false }),
      company: relationship({ ref: "Company.users", many: false }),
      extraFields: json(),
    },
  }),
  WorkOrder: list({
    ui: {
      labelField: "number",
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isEmployee,
        delete: isManager,
      },
    },
    fields: {
      number: text({ validation: { isRequired: true } }),
      materials: relationship({
        ref: "Material.workOrders",
        many: true,
      }),
      operations: relationship({
        ref: "WorkOrderOperation.workOrder",
        many: true,
      }),
      datePlanned: timestamp(),
      dateStarted: timestamp(),
      dateFinished: timestamp(),
      creator: relationship({
        ref: "User.workOrders",
        many: false,
      }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
  WorkOrderOperation: list({
    access: {
      filter: {
        query: companyFilter,
        update: companyFilter,
        delete: companyFilter,
      },
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isEmployee,
        delete: isEmployee,
      },
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context, resolvedData }) => {
        try {
          if (operation === "create") {
            resolvedData.company = {
              connect: {
                id: context.session.data.company.id,
              },
            };
          }
        } catch (error) {
          console.error(error);
        }
        try {
          if (operation === "update") {
            if (inputData.startedAt) {
              if (item.finishedAt) {
                throw new Error("Operation already finished");
              }
            }
            if (inputData.finishedAt) {
              if (!item.startedAt) {
                throw new Error("Operation not started");
              }
              if (item.finishedAt) {
                throw new Error("Operation already finished");
              }
              if (inputData.finishedAt < item.startedAt) {
                throw new Error("Finish date cannot be before start date");
              }
            }
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
    fields: {
      files: relationship({
        ref: "File",
        many: true,
      }),
      startedAt: timestamp(),
      finishedAt: timestamp(),
      name: text({ validation: { isRequired: true } }),
      description: text(),
      value: decimal({ validation: { isRequired: true, min: "0" } }),
      price: virtual({
        field: graphql.field({
          type: graphql.Decimal,
          async resolve(item, args, context): Promise<Decimal> {
            try {
              const workOrder = await context.query.WorkOrder.findOne({
                where: { id: item.workOrderId },
                query: "reduction",
              });
              let total = Number(item.value);

              total -= (total * (workOrder.reduction ?? 0)) / 100;
              return new Decimal(total);
            } catch (e) {
              return new Decimal(0);
            }
          },
        }),
      }),
      reduction: decimal({ defaultValue: "0" }),
      amount: decimal({ validation: { isRequired: true, min: "0" } }),
      total: virtual({
        field: graphql.field({
          type: graphql.Decimal,
          async resolve(item, args, context): Promise<Decimal> {
            try {
              const workOrder = await context.query.WorkOrder.findOne({
                where: { id: item.workOrderId },
                query: "reduction",
              });
              let total = Number(item.value) * Number(item.amount) - (Number(item.value) * Number(item.amount) * (Number(item.reduction) ?? 0)) / 100;

              total -= (total * (workOrder.reduction ?? 0)) / 100;
              return new Decimal(total);
            } catch (e) {
              return new Decimal(0);
            }
          },
        }),
      }),
      wastage: decimal({
        validation: { min: "0" },
        defaultValue: "0",
      }),
      workOrder: relationship({
        ref: "WorkOrder.operations",
        many: false,
      }),
      operation: relationship({
        ref: "Operation.workOrderOperations",
        many: false,
      }),
      company: relationship({ ref: "Company", many: false, access: { update: isSuperAdmin } }),
      extraFields: json(),
    },
  }),
};
