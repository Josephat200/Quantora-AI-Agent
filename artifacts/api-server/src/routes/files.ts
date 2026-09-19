import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { Router, type IRouter } from "express";
import { settings } from "../lib/settings";
import { files, newId } from "../lib/stores";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";

const router: IRouter = Router();
const uploadsDirectory = join(process.cwd(), "uploads");
const supportedTypes = new Map([
  ["application/pdf", "PDF"],
  ["text/plain", "TXT"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "DOCX"],
  ["text/csv", "CSV"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "XLSX"],
  ["application/json", "JSON"],
]);

async function readMultipart(req: AuthenticatedRequest): Promise<{ filename: string; contentType: string; data: Buffer }> {
  const contentType = req.header("content-type") ?? "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) throw new Error("A multipart/form-data request is required.");
  const boundary = `--${boundaryMatch[1] ?? boundaryMatch[2]}`;
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > settings.maxUploadSizeBytes + 1024 * 1024) throw new Error("File is too large.");
    chunks.push(buffer);
  }
  const body = Buffer.concat(chunks);
  const delimiter = Buffer.from(`\r\n${boundary}`);
  const firstBoundary = body.indexOf(Buffer.from(boundary));
  if (firstBoundary < 0) throw new Error("Malformed multipart body.");
  const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"), firstBoundary);
  if (headerEnd < 0) throw new Error("Malformed multipart headers.");
  const end = body.indexOf(delimiter, headerEnd + 4);
  if (end < 0) throw new Error("Malformed multipart body.");
  const headers = body.subarray(firstBoundary, headerEnd).toString("utf8");
  const disposition = headers.match(/filename="([^"]+)"/i);
  const type = headers.match(/content-type:\s*([^\r\n]+)/i);
  if (!disposition) throw new Error("No file was provided.");
  return {
    filename: basename(disposition[1]),
    contentType: (type?.[1] ?? "application/octet-stream").trim().toLowerCase(),
    data: body.subarray(headerEnd + 4, end),
  };
}

router.post("/v1/files/upload", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const upload = await readMultipart(req);
    const type = supportedTypes.get(upload.contentType);
    if (!type) {
      res.status(415).json({ success: false, error: { code: "UNSUPPORTED_FILE_TYPE", message: "Supported files are PDF, TXT, DOCX, CSV, XLSX, and JSON." } });
      return;
    }
    if (upload.data.length > settings.maxUploadSizeBytes) {
      res.status(413).json({ success: false, error: { code: "FILE_TOO_LARGE", message: `Files must be smaller than ${settings.maxUploadSizeBytes / 1024 / 1024} MB.` } });
      return;
    }
    await mkdir(uploadsDirectory, { recursive: true });
    const id = newId();
    const path = join(uploadsDirectory, `${id}-${upload.filename}`);
    await writeFile(path, upload.data, { flag: "wx" });
    const storedFile = { id, userId: req.user!.id, filename: upload.filename, contentType: upload.contentType, size: upload.data.length, path, createdAt: new Date().toISOString() };
    files.set(id, storedFile);
    res.status(201).json({ file_id: id, filename: storedFile.filename, content_type: storedFile.contentType, size: storedFile.size });
  } catch (error) {
    res.status(400).json({ success: false, error: { code: "INVALID_FILE", message: error instanceof Error ? error.message : "Unable to read the uploaded file." } });
  }
});

router.get("/v1/files/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const file = files.get(id);
  if (!file || file.userId !== req.user!.id) {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "File not found." } });
    return;
  }
  try {
    res.type(file.contentType).send(await readFile(file.path));
  } catch {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "File content is no longer available." } });
  }
});

router.delete("/v1/files/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const file = files.get(id);
  if (!file || file.userId !== req.user!.id) {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "File not found." } });
    return;
  }
  await unlink(file.path).catch(() => undefined);
  files.delete(id);
  res.status(204).send();
});

export default router;