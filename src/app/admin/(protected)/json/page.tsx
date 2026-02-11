import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminTabs } from "@/components/admin-tabs";
import { importPackagesJsonAction } from "../actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

type AdminJsonPageProps = {
  searchParams?: Promise<{ imported?: string }>;
};

const jsonExample = `{
  "packages": [
    {
      "packageCode": "PKG-CTG-001",
      "name": "Cartagena Clasica 4D/3N",
      "destination": "Cartagena, Colombia",
      "durationDays": 4,
      "basePrice": 2890,
      "isOffer": true,
      "offerPrice": 2490,
      "offerLabel": "Promo de temporada",
      "summary": "Escapada a Cartagena con city tour, playa y tiempo libre.",
      "description": "Paquete ideal para viajeros que quieren cultura, mar y descanso en pocos dias.",
      "coverImageUrl": "/logo-agencia.png",
      "gallery": [],
      "includes": [
        "Boleto aereo ida y vuelta",
        "Traslados aeropuerto-hotel-aeropuerto",
        "Hospedaje 3 noches",
        "Desayunos diarios"
      ],
      "excludes": [
        "Almuerzos y cenas",
        "Gastos personales",
        "Tours opcionales"
      ],
      "itinerary": [
        {
          "title": "Dia 1 - Llegada",
          "description": "Llegada, traslado al hotel y check-in."
        },
        {
          "title": "Dia 2 - Centro Historico",
          "description": "Recorrido guiado por la ciudad amurallada."
        },
        {
          "title": "Dia 3 - Playa",
          "description": "Dia libre de playa o tour opcional."
        },
        {
          "title": "Dia 4 - Regreso",
          "description": "Check-out y traslado al aeropuerto."
        }
      ]
    }
  ]
}`;

export default async function AdminJsonPage({ searchParams }: AdminJsonPageProps) {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    redirect("/admin/login");
  }

  const user =
    (session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            role: true,
          },
        })
      : null) ??
    (session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email.toLowerCase() },
          select: {
            role: true,
          },
        })
      : null);

  if (!user) {
    redirect("/admin/login");
  }

  if (user.role !== UserRole.ADMIN) {
    redirect("/admin");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const importedCount = Number(resolvedSearchParams.imported ?? "0");

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Panel admin</p>
            <h1 className="text-2xl font-semibold">Importar paquetes JSON</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Ver paquetes
            </Link>
          </div>
        </div>

        <AdminTabs current="json" />

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold">Pega el JSON completo</h2>
          <p className="mt-1 text-sm text-slate-600">
            Puedes pegar un objeto unico, un arreglo de objetos o un objeto con `packages`. Todo se guardara en
            borrador para que completes imagenes despues.
          </p>

          {importedCount > 0 ? (
            <p className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
              Importacion completada. Registros procesados: {importedCount} (estado: borrador)
            </p>
          ) : null}

          <form action={importPackagesJsonAction} className="mt-4 space-y-3">
            <textarea
              name="jsonPayload"
              required
              className="min-h-72 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm"
              placeholder='{"packages":[{...}]}'
            />
            <button
              type="submit"
              className="rounded-lg bg-[#3C4F66] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#324356]"
            >
              Importar JSON
            </button>
          </form>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Ejemplo para IA</h3>
            <a
              href="/examples/package-import-example.json"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
            >
              Abrir ejemplo .json
            </a>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Usa este formato como plantilla. Si una IA genera paquetes, debe respetar estas llaves y tipos.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-6 text-slate-100">
            {jsonExample}
          </pre>
        </div>
      </section>
    </main>
  );
}
