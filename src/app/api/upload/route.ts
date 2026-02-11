import { randomUUID } from "crypto";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import type { ReadableStream as NodeReadableStream } from "stream/web";
import { NextResponse } from "next/server";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxFileBytes = 4 * 1024 * 1024;
const maxFilesPerRequest = 8;
const maxTotalBytesPerRequest = 20 * 1024 * 1024;

function extensionFromFile(file: File) {
  const type = file.type;
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/avif") return ".avif";
  return ".jpg";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No se recibieron archivos" }, { status: 400 });
  }

  if (files.length > maxFilesPerRequest) {
    return NextResponse.json(
      { error: `Puedes subir hasta ${maxFilesPerRequest} imagenes por carga` },
      { status: 400 },
    );
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > maxTotalBytesPerRequest) {
    return NextResponse.json(
      { error: "El total de imagenes supera el limite permitido por carga" },
      { status: 400 },
    );
  }

  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];

  for (const file of files) {
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    if (file.size > maxFileBytes) {
      return NextResponse.json({ error: "Cada imagen debe ser menor o igual a 4MB" }, { status: 400 });
    }

    const filename = `${Date.now()}-${randomUUID()}${extensionFromFile(file)}`;
    const filePath = path.join(uploadDir, filename);

    // Stream file contents directly to disk to avoid buffering whole files in RAM.
    await pipeline(
      Readable.fromWeb(file.stream() as unknown as NodeReadableStream),
      createWriteStream(filePath),
    );
    urls.push(`/api/uploads/${filename}`);
  }

  return NextResponse.json({ urls });
}
