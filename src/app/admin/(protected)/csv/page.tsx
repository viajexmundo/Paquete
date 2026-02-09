import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminTabs } from "@/components/admin-tabs";
import { importPackagesCsvAction } from "../actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

type AdminCsvPageProps = {
  searchParams?: Promise<{ imported?: string }>;
};

export default async function AdminCsvPage({ searchParams }: AdminCsvPageProps) {
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
            <h1 className="text-2xl font-semibold">Importar y exportar CSV</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Ver paquetes
            </Link>
            <Link
              href="/admin/csv/export"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Exportar CSV
            </Link>
          </div>
        </div>

        <AdminTabs current="csv" />

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold">Importar paquetes desde CSV</h2>
          <p className="mt-1 text-sm text-slate-600">
            El archivo debe incluir columnas como: packageCode, name, destination, basePrice, status, includes,
            excludes e itinerary.
          </p>

          {importedCount > 0 ? (
            <p className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
              Importacion completada. Registros procesados: {importedCount}
            </p>
          ) : null}

          <form action={importPackagesCsvAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              name="csvFile"
              accept=".csv,text/csv"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#3C4F66] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#324356]"
            >
              Importar CSV
            </button>
          </form>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold">Formato recomendado</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>`gallery`, `includes` y `excludes`: separar items con `||`.</li>
            <li>`itinerary`: usar `Titulo::Descripcion||Titulo2::Descripcion2`.</li>
            <li>`status`: `DRAFT`, `PUBLISHED` o `ARCHIVED`.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
