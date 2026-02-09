import { PackageStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildPackagesCsv } from "@/lib/csv/packages-csv";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const packages = await prisma.package.findMany({
    where: { status: PackageStatus.PUBLISHED },
    orderBy: [{ isOffer: "desc" }, { createdAt: "desc" }],
    select: {
      packageCode: true,
      name: true,
      destination: true,
      durationDays: true,
      basePrice: true,
      offerPrice: true,
      isOffer: true,
      offerLabel: true,
      status: true,
      summary: true,
      description: true,
      coverImageUrl: true,
      gallery: true,
      includes: true,
      excludes: true,
      itinerary: true,
    },
  });

  const csv = buildPackagesCsv(packages);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="paquetes-disponibles-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
