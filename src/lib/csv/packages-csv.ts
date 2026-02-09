import { PackageStatus, type Prisma } from "@prisma/client";

export const packageCsvColumns = [
  "packageCode",
  "name",
  "destination",
  "durationDays",
  "basePrice",
  "offerPrice",
  "isOffer",
  "offerLabel",
  "status",
  "summary",
  "description",
  "coverImageUrl",
  "gallery",
  "includes",
  "excludes",
  "itinerary",
] as const;

type CsvPackage = {
  packageCode: string;
  name: string;
  destination: string;
  durationDays: number;
  basePrice: number;
  offerPrice: number | null;
  isOffer: boolean;
  offerLabel: string | null;
  status: PackageStatus;
  summary: string;
  description: string;
  coverImageUrl: string;
  gallery: string[];
  includes: string[];
  excludes: string[];
  itinerary: Array<{ day: number; title: string; description: string }>;
};

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function toPipeList(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return "";
  return value.map((item) => String(item)).join("||");
}

function toPipeItinerary(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      const day = item as { title?: string; description?: string };
      return `${day.title ?? ""}::${day.description ?? ""}`;
    })
    .join("||");
}

export function buildPackagesCsv(
  packages: Array<{
    packageCode: string;
    name: string;
    destination: string;
    durationDays: number;
    basePrice: number;
    offerPrice: number | null;
    isOffer: boolean;
    offerLabel: string | null;
    status: PackageStatus;
    summary: string;
    description: string;
    coverImageUrl: string;
    gallery: Prisma.JsonValue;
    includes: Prisma.JsonValue;
    excludes: Prisma.JsonValue;
    itinerary: Prisma.JsonValue;
  }>,
) {
  const header = packageCsvColumns.join(",");

  const rows = packages.map((pkg) => {
    const values = [
      pkg.packageCode,
      pkg.name,
      pkg.destination,
      String(pkg.durationDays),
      String(pkg.basePrice),
      pkg.offerPrice == null ? "" : String(pkg.offerPrice),
      pkg.isOffer ? "true" : "false",
      pkg.offerLabel ?? "",
      pkg.status,
      pkg.summary,
      pkg.description,
      pkg.coverImageUrl,
      toPipeList(pkg.gallery),
      toPipeList(pkg.includes),
      toPipeList(pkg.excludes),
      toPipeItinerary(pkg.itinerary),
    ];

    return values.map((value) => escapeCsv(value)).join(",");
  });

  return [header, ...rows].join("\n");
}

function parsePipeList(value: string) {
  return value
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseItinerary(value: string) {
  return parsePipeList(value).map((item, index) => {
    const [title, ...descriptionParts] = item.split("::");
    return {
      day: index + 1,
      title: title?.trim() || `Dia ${index + 1}`,
      description: descriptionParts.join("::").trim() || "Actividad por definir",
    };
  });
}

function parseStatus(value: string): PackageStatus {
  if (value === "PUBLISHED") return "PUBLISHED";
  if (value === "ARCHIVED") return "ARCHIVED";
  return "DRAFT";
}

export function parsePackagesCsv(csvText: string): CsvPackage[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]);
  const requiredHeaders = packageCsvColumns as readonly string[];

  for (const requiredHeader of requiredHeaders) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(`Falta columna requerida: ${requiredHeader}`);
    }
  }

  const rows: CsvPackage[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const rawValues = splitCsvLine(lines[i]);
    const record = Object.fromEntries(headers.map((header, index) => [header, rawValues[index] ?? ""]));

    if (!record.packageCode || !record.name || !record.destination) {
      continue;
    }

    const durationDays = Number(record.durationDays || "1");
    const basePrice = Number(record.basePrice || "0");
    const offerPrice = record.offerPrice ? Number(record.offerPrice) : null;

    rows.push({
      packageCode: record.packageCode,
      name: record.name,
      destination: record.destination,
      durationDays: Number.isFinite(durationDays) && durationDays > 0 ? Math.floor(durationDays) : 1,
      basePrice: Number.isFinite(basePrice) && basePrice > 0 ? Math.floor(basePrice) : 1,
      offerPrice: offerPrice != null && Number.isFinite(offerPrice) && offerPrice > 0 ? Math.floor(offerPrice) : null,
      isOffer: record.isOffer === "true",
      offerLabel: record.offerLabel || null,
      status: parseStatus(record.status),
      summary: record.summary || "Sin resumen",
      description: record.description || "Sin descripcion",
      coverImageUrl: record.coverImageUrl || "",
      gallery: parsePipeList(record.gallery || ""),
      includes: parsePipeList(record.includes || ""),
      excludes: parsePipeList(record.excludes || ""),
      itinerary: parseItinerary(record.itinerary || ""),
    });
  }

  return rows;
}
