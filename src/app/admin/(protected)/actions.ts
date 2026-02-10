"use server";

import bcrypt from "bcryptjs";
import { PackageStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { parsePackagesCsv } from "@/lib/csv/packages-csv";
import { prisma } from "@/lib/db/prisma";
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
  const lines = raw
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
  role: z.enum(["ADMIN", "EDITOR"]),
  canManagePackages: z.string().optional(),
});

const updateUserAccessSchema = z.object({
  userId: z.string().min(8),
  role: z.enum(["ADMIN", "EDITOR"]),
  canManagePackages: z.string().optional(),
});

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
      canManagePackages: role === UserRole.ADMIN ? true : data.canManagePackages === "on",
    },
    create: {
      email,
      passwordHash,
      role,
      canManagePackages: role === UserRole.ADMIN ? true : data.canManagePackages === "on",
    },
  });

  revalidatePath("/admin/usuarios");
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
      canManagePackages: role === UserRole.ADMIN ? true : data.canManagePackages === "on",
    },
  });

  revalidatePath("/admin/usuarios");
}
