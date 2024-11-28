import { dateFormatBe, dateFormatOnlyDate } from "../utils/formatters/dateformatters";
import { generateCreditNoteOut } from "../utils/creditnoteoutpdf";
import { generateInvoiceOut } from "../utils/invoiceoutpdf";
import { documentToXml } from "../utils/xml/ayfemaxml";
import { sendMail } from "../utils/sendmail";
import { workerData } from "worker_threads";
import archiver from "archiver";
import fs from "fs-extra";
import path from "path";
import os from "os";

const documents = workerData.documents;
const company = workerData.company;

async function writeAllXmlsToTempDir(tempDir: string, documents: any[]): Promise<string[]> {
  const response = await fetch(documents.at(0).establishment.logo.url);
  let logoBuffer = await Buffer.from(await response.arrayBuffer());
  await fs.ensureDir(tempDir);

  const filePaths = await Promise.all(
    documents.map(async (doc) => {
      let pdf;

      if (doc.type == "invoice") {
        pdf = await generateInvoiceOut({
          document: doc,
          logoBuffer: logoBuffer,
        });
      } else if (doc.type == "credit_note") {
        pdf = await generateCreditNoteOut({
          document: doc,
          logoBuffer: logoBuffer,
        });
      } else if (doc.type == "purchase") {
        pdf = doc.files[0].url;
      }

      let xml = documentToXml(doc, pdf);
      const filePath = path.join(tempDir, xml.filename);
      await fs.writeFile(filePath, xml.content);

      return filePath;
    })
  );

  return filePaths;
}

async function writeAllPdfsToTempDir(tempDir: string, documents: any[]): Promise<string[]> {
  const response = await fetch(documents.at(0).establishmentlogo.url);
  let logoBuffer = await Buffer.from(await response.arrayBuffer());
  await fs.ensureDir(tempDir);

  const filePaths = await Promise.all(
    documents.map(async (doc) => {
      const filePath = path.join(tempDir, `${doc.type}_${doc.prefix ?? ""}${doc.number}.pdf`);
      let pdf;
      try {
        pdf = await generateInvoiceOut({
          document: doc,
          logoBuffer: logoBuffer,
        });
      } catch (error) {
        pdf = null;
        throw new Error(error);
      }
      await fs.writeFile(filePath, pdf.content);

      return filePath;
    })
  );

  return filePaths;
}

async function createZip(tempDir: string, zipPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];
    const archive = archiver("zip", { zlib: { level: 5 } });

    archive.on("data", (chunk: Buffer) => {
      buffers.push(chunk);
    });

    archive.on("error", (err) => {
      console.error("Error with archive:", err);
      reject(err);
    });

    archive.on("end", () => {
      try {
        fs.writeFileSync(zipPath, Buffer.concat(buffers));
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    archive.directory(tempDir, false);

    archive
      .finalize()
      .then(() => {})
      .catch((err) => {
        console.error("Error finalizing archive:", err);
        reject(err);
      });
  });
}

async function sendEmailWithAttachment(zipPath: string): Promise<void> {
  await sendMail({
    recipient: company.accountantEmail,
    subject: `Documenten ${company.name} ${dateFormatBe(documents.at(0).date)} - ${dateFormatBe(documents.at(-1).date)}`,
    company: company,
    attachments: [
      {
        filename: zipPath.split("/").pop(),
        path: zipPath,
      },
    ],
    html: `<p>Beste, in bijlage alle documenten van ${company.name} voor het periode tussen ${
      dateFormatBe(documents.at(0).date) + " en " + dateFormatBe(documents.at(-1).date)
    }.</p>`,
  });
}

const run = async () => {
  try {
    const tempDir = path.join(os.tmpdir(), "pdf_temp" + company.id + dateFormatOnlyDate(documents.at(0).date));
    await fs.emptyDir(tempDir);
    // await writeAllPdfsToTempDir(tempDir, documents);
    await writeAllXmlsToTempDir(tempDir, documents);
    const zipPath = path.join(
      tempDir,
      "documents_" + company.name + "_" + dateFormatOnlyDate(documents.at(0).date) + "_" + dateFormatOnlyDate(documents.at(-1).date) + ".zip"
    );
    await createZip(tempDir, zipPath);
    await sendEmailWithAttachment(zipPath);
    console.log(
      "Worker for dates",
      dateFormatOnlyDate(documents.at(0).date),
      "to",
      dateFormatOnlyDate(documents.at(-1).date),
      "for company",
      company.name,
      "finished"
    );
  } catch (error) {
    console.log(documents.at(0));
    console.error("An error occurred:", error);
  }
};

run();
