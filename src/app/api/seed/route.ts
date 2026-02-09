import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { buildSlug } from "@/lib/packages";

export async function GET() {
  try {
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({ message: "Seed ya fue ejecutado. Usuarios existentes: " + existingUsers });
    }

    const adminEmail = "admin@agencia.com";
    const adminPassword = "Admin12345";
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const alanEmail = "alangarcia@viajexmundo.com.gt";
    const alanPasswordHash = await bcrypt.hash("Viaja2026", 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: "Administrador Principal",
        passwordHash,
        role: "ADMIN",
        isActive: true,
        canManagePackages: true,
        canManageCsv: true,
        canManageUsers: true,
      },
    });

    await prisma.user.create({
      data: {
        email: alanEmail,
        fullName: "Alan Garcia",
        passwordHash: alanPasswordHash,
        role: "ADMIN",
        isActive: true,
        canManagePackages: true,
        canManageCsv: true,
        canManageUsers: true,
      },
    });

    const seedPackages = [
      {
        packageCode: "PKG-001",
        name: "Roatan Escape 5D4N",
        destination: "Roatan",
        durationDays: 5,
        basePrice: 6990,
        offerPrice: 5990,
        isOffer: true,
        offerLabel: "Oferta de temporada",
        summary: "Playa caribena, hotel todo incluido y actividades guiadas para desconectar.",
        description: "Un paquete completo para disfrutar mar, gastronomia y actividades en Roatan.",
        coverImageUrl: "https://images.unsplash.com/photo-1552074284-5e88ef1aef18?auto=format&fit=crop&w=1600&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        ],
        includes: ["Vuelo redondo desde Ciudad de Guatemala", "4 noches en hotel 4 estrellas", "Desayunos y cenas", "Traslados aeropuerto-hotel-aeropuerto"],
        excludes: ["Gastos personales", "Propinas", "Seguro de viaje"],
        itinerary: [
          { day: 1, title: "Llegada y check-in", description: "Recepcion en aeropuerto, traslado al hotel y tarde libre para playa." },
          { day: 2, title: "Tour marino", description: "Salida en lancha con snorkel y tiempo libre en playa." },
          { day: 3, title: "Dia libre", description: "Recomendaciones de actividades opcionales y descanso en resort." },
          { day: 4, title: "Experiencia local", description: "Visita a zona comercial y cena especial de despedida." },
          { day: 5, title: "Regreso", description: "Check-out y traslado al aeropuerto." },
        ],
      },
      {
        packageCode: "PKG-002",
        name: "Antigua Cultural 3D2N",
        destination: "Antigua Guatemala",
        durationDays: 3,
        basePrice: 2490,
        offerPrice: null,
        isOffer: false,
        offerLabel: null,
        summary: "Historia, arquitectura y gastronomia local con guia profesional.",
        description: "Ideal para viajeros que buscan una escapada cultural corta y bien organizada.",
        coverImageUrl: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?auto=format&fit=crop&w=1600&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80",
        ],
        includes: ["2 noches de hospedaje boutique", "Transporte interno", "Entradas a museos", "Guia certificado"],
        excludes: ["Almuerzos", "Seguro de viaje"],
        itinerary: [
          { day: 1, title: "Llegada y centro historico", description: "Check-in y recorrido por calles coloniales." },
          { day: 2, title: "Ruta cultural", description: "Museos, templos y experiencia gastronomica." },
          { day: 3, title: "Salida", description: "Traslado y cierre de itinerario." },
        ],
      },
      {
        packageCode: "PKG-003",
        name: "Atitlan Nature 4D3N",
        destination: "Lago de Atitlan",
        durationDays: 4,
        basePrice: 3290,
        offerPrice: 2890,
        isOffer: true,
        offerLabel: "Cupo limitado",
        summary: "Naturaleza, pueblos del lago y experiencias autenticas.",
        description: "Escapada con enfoque en paisajes y cultura local alrededor del lago.",
        coverImageUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1600&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80",
        ],
        includes: ["3 noches de hospedaje", "Tour en lancha", "Desayunos", "Traslados internos"],
        excludes: ["Vuelos", "Propinas", "Actividades opcionales"],
        itinerary: [
          { day: 1, title: "Llegada", description: "Check-in y vista panoramica del lago." },
          { day: 2, title: "Pueblos del lago", description: "Recorrido por pueblos y mercados locales." },
          { day: 3, title: "Naturaleza", description: "Caminata guiada y tarde libre." },
          { day: 4, title: "Salida", description: "Regreso a Ciudad de Guatemala." },
        ],
      },
    ];

    for (const pkg of seedPackages) {
      await prisma.package.create({
        data: {
          ...pkg,
          slug: buildSlug(pkg.name),
          currency: "GTQ",
          status: "PUBLISHED",
          createdById: admin.id,
        },
      });
    }

    return NextResponse.json({ message: "Seed completado: 2 usuarios + 3 paquetes creados." });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
