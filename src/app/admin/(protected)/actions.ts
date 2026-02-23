"use server";

import bcrypt from "bcryptjs";
import { PackageStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { parsePackagesCsv } from "@/lib/csv/packages-csv";
import { prisma } from "@/lib/db/prisma";
import { landingVariantKey, landingVariantValues, type LandingVariant } from "@/lib/landing";
import { buildSlug } from "@/lib/packages";

const packageSchema = z.object({
  packageCode: z.string().min(3),
  name: z.string().min(3),
  destination: z.string().min(2),
  durationDays: z.coerce.number().int().min(1),
  basePrice: z.coerce.number().int().min(1),
  offerPrice: z
    .string()
    .optional()
    .transform((value) => {
      const raw = (value ?? "").trim();
      if (!raw) return null;
      const numberValue = Number(raw);
      return Number.isFinite(numberValue) ? Math.floor(numberValue) : null;
    }),
  isOffer: z.enum(["true", "false"]),
  offerLabel: z
    .string()
    .optional()
    .transform((value) => {
      const raw = (value ?? "").trim();
      return raw.length > 0 ? raw : null;
    }),
  summary: z.string().min(10),
  description: z.string().min(10),
  coverImageUrl: z.string().optional().default("/logo-agencia.png"),
  gallery: z.string().optional().default(""),
  includes: z.string().min(2),
  excludes: z.string().min(2),
  itinerary: z.string().min(2),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

function toList(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toItinerary(raw: string) {
  const input = raw.trim();
  if (!input) {
    return [{ day: 1, title: "Dia 1", description: "Actividad por definir" }];
  }

  // New format from form: JSON array of itinerary blocks.
  try {
    const parsed = JSON.parse(input) as unknown;
    if (Array.isArray(parsed)) {
      const normalized = parsed
        .map((item, index) => {
          const step = item as { title?: unknown; description?: unknown };
          const title = typeof step.title === "string" ? step.title.trim() : "";
          const description = typeof step.description === "string" ? step.description.trim() : "";
          return {
            day: index + 1,
            title: title || `Dia ${index + 1}`,
            description: description || "Actividad por definir",
          };
        })
        .filter((step) => step.title || step.description);

      if (normalized.length > 0) {
        return normalized;
      }
    }
  } catch {
    // Legacy format fallback: one line per day -> "Titulo | Descripcion"
  }

  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const [title, ...descriptionParts] = line.split("|");
    return {
      day: index + 1,
      title: title?.trim() || `Dia ${index + 1}`,
      description: descriptionParts.join("|").trim() || "Actividad por definir",
    };
  });
}

type AccessKey = "canManagePackages" | "canManageCsv" | "canManageUsers";

function hasPermission(
  user: { role: UserRole; canManagePackages: boolean },
  permission: AccessKey,
) {
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  if (permission === "canManagePackages") {
    return user.canManagePackages;
  }

  return false;
}

async function assertPermission(permission: AccessKey) {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    redirect("/admin/login");
  }

  const dbUser =
    (session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            email: true,
            role: true,
            canManagePackages: true,
          },
        })
      : null) ??
    (session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            role: true,
            canManagePackages: true,
          },
        })
      : null);

  if (!dbUser) {
    redirect("/admin/login");
  }

  if (!hasPermission(dbUser, permission)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  return dbUser;
}

export async function createPackageAction(formData: FormData) {
  const user = await assertPermission("canManagePackages");

  const parsed = packageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`Datos invalidos al crear paquete: ${fieldErrors}`);
  }

  const data = parsed.data;

  await prisma.package.create({
    data: {
      packageCode: data.packageCode,
      slug: buildSlug(data.name),
      name: data.name,
      destination: data.destination,
      durationDays: data.durationDays,
      basePrice: data.basePrice,
      offerPrice: data.isOffer === "true" ? data.offerPrice : null,
      isOffer: data.isOffer === "true",
      offerLabel: data.isOffer === "true" ? data.offerLabel : null,
      currency: "GTQ",
      summary: data.summary,
      description: data.description,
      coverImageUrl: data.coverImageUrl,
      gallery: toList(data.gallery),
      includes: toList(data.includes),
      excludes: toList(data.excludes),
      itinerary: toItinerary(data.itinerary),
      status: data.status as PackageStatus,
      createdById: user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updatePackageAction(id: string, formData: FormData) {
  await assertPermission("canManagePackages");

  const parsed = packageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`Datos invalidos al actualizar paquete: ${fieldErrors}`);
  }

  const data = parsed.data;

  await prisma.package.update({
    where: { id },
    data: {
      packageCode: data.packageCode,
      slug: buildSlug(data.name),
      name: data.name,
      destination: data.destination,
      durationDays: data.durationDays,
      basePrice: data.basePrice,
      offerPrice: data.isOffer === "true" ? data.offerPrice : null,
      isOffer: data.isOffer === "true",
      offerLabel: data.isOffer === "true" ? data.offerLabel : null,
      currency: "GTQ",
      summary: data.summary,
      description: data.description,
      coverImageUrl: data.coverImageUrl,
      gallery: toList(data.gallery),
      includes: toList(data.includes),
      excludes: toList(data.excludes),
      itinerary: toItinerary(data.itinerary),
      status: data.status as PackageStatus,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/paquetes/${buildSlug(data.name)}`);
  redirect("/admin");
}

export async function togglePackageStatusAction(id: string, nextStatus: PackageStatus) {
  await assertPermission("canManagePackages");

  await prisma.package.update({
    where: { id },
    data: {
      status: nextStatus,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deletePackageAction(id: string) {
  await assertPermission("canManagePackages");

  const existingPackage = await prisma.package.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!existingPackage) {
    throw new Error("El paquete que intentas borrar no existe");
  }

  await prisma.package.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/paquetes");
  revalidatePath("/admin");
  revalidatePath(`/paquetes/${existingPackage.slug}`);
}

export async function importPackagesCsvAction(formData: FormData) {
  const user = await assertPermission("canManageCsv");
  const csvFile = formData.get("csvFile");

  if (!(csvFile instanceof File)) {
    throw new Error("Debes seleccionar un archivo CSV");
  }

  const csvText = await csvFile.text();
  const rows = parsePackagesCsv(csvText);

  for (const row of rows) {
    await prisma.package.upsert({
      where: { packageCode: row.packageCode },
      update: {
        slug: buildSlug(row.name),
        name: row.name,
        destination: row.destination,
        durationDays: row.durationDays,
        basePrice: row.basePrice,
        offerPrice: row.isOffer ? row.offerPrice : null,
        isOffer: row.isOffer,
        offerLabel: row.isOffer ? row.offerLabel : null,
        currency: "GTQ",
        summary: row.summary,
        description: row.description,
        coverImageUrl: row.coverImageUrl || "/logo-agencia.png",
        gallery: row.gallery,
        includes: row.includes,
        excludes: row.excludes,
        itinerary: row.itinerary,
        status: row.status,
      },
      create: {
        packageCode: row.packageCode,
        slug: buildSlug(row.name),
        name: row.name,
        destination: row.destination,
        durationDays: row.durationDays,
        basePrice: row.basePrice,
        offerPrice: row.isOffer ? row.offerPrice : null,
        isOffer: row.isOffer,
        offerLabel: row.isOffer ? row.offerLabel : null,
        currency: "GTQ",
        summary: row.summary,
        description: row.description,
        coverImageUrl: row.coverImageUrl || "/logo-agencia.png",
        gallery: row.gallery,
        includes: row.includes,
        excludes: row.excludes,
        itinerary: row.itinerary,
        status: row.status,
        createdById: user.id,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/paquetes");
  revalidatePath("/admin");
  revalidatePath("/admin/csv");
  redirect(`/admin/csv?imported=${rows.length}`);
}

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "EDITOR", "COTIZADOR"]),
  canManagePackages: z.string().optional(),
});

const updateUserAccessSchema = z.object({
  userId: z.string().min(8),
  role: z.enum(["ADMIN", "EDITOR", "COTIZADOR"]),
  canManagePackages: z.string().optional(),
});

const updateLandingVariantSchema = z.object({
  variant: z.enum(landingVariantValues),
});

const importJsonItinerarySchema = z.object({
  day: z.number().int().min(1).optional(),
  title: z.string().min(1),
  description: z.string().min(1),
});

const importJsonPackageSchema = z.object({
  packageCode: z.string().min(3),
  name: z.string().min(3),
  destination: z.string().min(2),
  durationDays: z.number().int().min(1),
  basePrice: z.number().int().min(1),
  offerPrice: z.number().int().min(1).nullable().optional(),
  isOffer: z.boolean().optional().default(false),
  offerLabel: z.string().nullable().optional(),
  summary: z.string().min(10),
  description: z.string().min(10),
  coverImageUrl: z.string().optional(),
  gallery: z.array(z.string()).optional().default([]),
  includes: z.array(z.string()).optional().default([]),
  excludes: z.array(z.string()).optional().default([]),
  itinerary: z.array(importJsonItinerarySchema).min(1),
});

function normalizeJsonImportInput(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object" && Array.isArray((value as { packages?: unknown }).packages)) {
    return (value as { packages: unknown[] }).packages;
  }

  return [value];
}

export async function createUserAction(formData: FormData) {
  await assertPermission("canManageUsers");

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Datos invalidos para crear usuario");
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(data.password, 10);
  const role = data.role as UserRole;

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role,
      canManagePackages:
        role === UserRole.ADMIN ? true : role === UserRole.EDITOR ? data.canManagePackages === "on" : false,
    },
    create: {
      email,
      passwordHash,
      role,
      canManagePackages:
        role === UserRole.ADMIN ? true : role === UserRole.EDITOR ? data.canManagePackages === "on" : false,
    },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function updateUserAccessAction(formData: FormData) {
  await assertPermission("canManageUsers");

  const parsed = updateUserAccessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Datos invalidos para actualizar permisos");
  }

  const data = parsed.data;
  const role = data.role as UserRole;

  await prisma.user.update({
    where: { id: data.userId },
    data: {
      role,
      canManagePackages:
        role === UserRole.ADMIN ? true : role === UserRole.EDITOR ? data.canManagePackages === "on" : false,
    },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function updateLandingVariantAction(formData: FormData) {
  await assertPermission("canManagePackages");

  const parsed = updateLandingVariantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Datos invalidos para actualizar la landing");
  }

  try {
    await prisma.appSetting.upsert({
      where: { key: landingVariantKey },
      update: {
        value: parsed.data.variant as LandingVariant,
      },
      create: {
        key: landingVariantKey,
        value: parsed.data.variant as LandingVariant,
      },
    });
  } catch {
    throw new Error("No se pudo guardar la landing. Ejecuta prisma db push para crear AppSetting.");
  }

  revalidatePath("/");
  revalidatePath("/admin/landing");
}

export async function importPackagesJsonAction(formData: FormData) {
  const user = await assertPermission("canManageCsv");
  const jsonPayload = formData.get("jsonPayload");

  if (typeof jsonPayload !== "string" || !jsonPayload.trim()) {
    throw new Error("Debes pegar un JSON valido");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonPayload);
  } catch {
    throw new Error("El contenido no es un JSON valido");
  }

  const candidates = normalizeJsonImportInput(parsedJson);
  const parsedRows = z.array(importJsonPackageSchema).safeParse(candidates);
  if (!parsedRows.success) {
    const detail = parsedRows.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join(", ");
    throw new Error(`JSON invalido para importacion: ${detail}`);
  }

  for (const row of parsedRows.data) {
    await prisma.package.upsert({
      where: { packageCode: row.packageCode },
      update: {
        slug: buildSlug(row.name),
        name: row.name,
        destination: row.destination,
        durationDays: row.durationDays,
        basePrice: row.basePrice,
        offerPrice: row.isOffer ? row.offerPrice ?? null : null,
        isOffer: row.isOffer,
        offerLabel: row.isOffer ? row.offerLabel ?? null : null,
        currency: "GTQ",
        summary: row.summary,
        description: row.description,
        coverImageUrl: row.coverImageUrl || "/logo-agencia.png",
        gallery: row.gallery,
        includes: row.includes,
        excludes: row.excludes,
        itinerary: row.itinerary.map((step, index) => ({
          day: index + 1,
          title: step.title,
          description: step.description,
        })),
        status: PackageStatus.DRAFT,
      },
      create: {
        packageCode: row.packageCode,
        slug: buildSlug(row.name),
        name: row.name,
        destination: row.destination,
        durationDays: row.durationDays,
        basePrice: row.basePrice,
        offerPrice: row.isOffer ? row.offerPrice ?? null : null,
        isOffer: row.isOffer,
        offerLabel: row.isOffer ? row.offerLabel ?? null : null,
        currency: "GTQ",
        summary: row.summary,
        description: row.description,
        coverImageUrl: row.coverImageUrl || "/logo-agencia.png",
        gallery: row.gallery,
        includes: row.includes,
        excludes: row.excludes,
        itinerary: row.itinerary.map((step, index) => ({
          day: index + 1,
          title: step.title,
          description: step.description,
        })),
        status: PackageStatus.DRAFT,
        createdById: user.id,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/paquetes");
  revalidatePath("/admin");
  revalidatePath("/admin/json");
  redirect(`/admin/json?imported=${parsedRows.data.length}`);
}
