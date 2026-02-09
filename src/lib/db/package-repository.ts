import { PackageStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { TravelPackage } from "@/lib/packages";

function toStringArray(value: Prisma.JsonValue) {
  return Array.isArray(value) ? (value as string[]) : [];
}

function mapPackage(record: {
  id: string;
  packageCode: string;
  slug: string;
  name: string;
  destination: string;
  durationDays: number;
  basePrice: number;
  offerPrice: number | null;
  isOffer: boolean;
  offerLabel: string | null;
  currency: string;
  summary: string;
  description: string;
  coverImageUrl: string;
  gallery: Prisma.JsonValue;
  includes: Prisma.JsonValue;
  excludes: Prisma.JsonValue;
  itinerary: Prisma.JsonValue;
}): TravelPackage {
  return {
    id: record.id,
    packageCode: record.packageCode,
    slug: record.slug,
    name: record.name,
    destination: record.destination,
    durationDays: record.durationDays,
    basePrice: record.basePrice,
    offerPrice: record.offerPrice,
    isOffer: record.isOffer,
    offerLabel: record.offerLabel,
    currency: "GTQ",
    summary: record.summary,
    description: record.description,
    coverImage: record.coverImageUrl,
    gallery: toStringArray(record.gallery),
    includes: toStringArray(record.includes),
    excludes: toStringArray(record.excludes),
    itinerary: Array.isArray(record.itinerary)
      ? (record.itinerary as Array<{ day: number; title: string; description: string }>)
      : [],
  };
}

const packageSelect = {
  id: true,
  packageCode: true,
  slug: true,
  name: true,
  destination: true,
  durationDays: true,
  basePrice: true,
  offerPrice: true,
  isOffer: true,
  offerLabel: true,
  currency: true,
  summary: true,
  description: true,
  coverImageUrl: true,
  gallery: true,
  includes: true,
  excludes: true,
  itinerary: true,
} satisfies Prisma.PackageSelect;

export async function getPublishedPackages() {
  const packages = await prisma.package.findMany({
    where: { status: PackageStatus.PUBLISHED },
    orderBy: [{ isOffer: "desc" }, { createdAt: "desc" }],
    select: packageSelect,
  });

  return packages.map(mapPackage);
}

export async function getAllPackages() {
  const packages = await prisma.package.findMany({
    orderBy: [{ isOffer: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      packageCode: true,
      name: true,
      destination: true,
      status: true,
      isOffer: true,
      offerPrice: true,
      basePrice: true,
      durationDays: true,
      updatedAt: true,
    },
  });

  return packages;
}

export async function getPublishedPackageBySlug(slug: string) {
  const record = await prisma.package.findFirst({
    where: { slug, status: PackageStatus.PUBLISHED },
    select: packageSelect,
  });

  return record ? mapPackage(record) : null;
}

export async function getAnyPackageById(id: string) {
  return prisma.package.findUnique({
    where: { id },
  });
}
