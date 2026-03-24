import Link from "next/link";
import { PackageStatus, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminTabs } from "@/components/admin-tabs";
import { LogoutButton } from "@/components/logout-button";
import { auth } from "@/lib/auth";
import { getAllPackages } from "@/lib/db/package-repository";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/packages";

const statusLabel: Record<PackageStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

export default async function AdminDashboardPage() {
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
            canManagePackages: true,
          },
        })
      : null) ??
    (session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email.toLowerCase() },
          select: {
            role: true,
            canManagePackages: true,
          },
        })
      : null);

  if (!user) {
    redirect("/admin/login");
  }

  if (user.role === UserRole.COTIZADOR) {
    redirect("/admin/cotizador");
  }

  if (user.role !== UserRole.ADMIN && !user.canManagePackages) {
    redirect("/admin/usuarios");
  }

  const packages = await getAllPackages();
  const publishedCount = packages.filter((pkg) => pkg.status === "PUBLISHED").length;
  const draftCount = packages.filter((pkg) => pkg.status === "DRAFT").length;
  const archivedCount = packages.filter((pkg) => pkg.status === "ARCHIVED").length;
  const offerCount = packages.filter((pkg) => pkg.isOffer).length;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      {/* ── AVISO DE MIGRACIÓN ── */}
      <section className="mx-auto max-w-6xl mb-5 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5">
        <div className="flex items-start gap-4">
          <span className="text-3xl select-none">⚠️</span>
          <div>
            <p className="font-bold text-amber-900 text-base">Este panel ya no se usa para administrar paquetes</p>
            <p className="text-amber-800 text-sm mt-1">
              Los paquetes ahora se gestionan desde la plataforma central <strong>VentasVXM</strong>.
              Para agregar, editar o publicar paquetes, ingresa a la plataforma nueva.
            </p>
            <a
              href="https://ventasvxm.vercel.app/paquetes"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 transition"
            >
              Ir a la plataforma VentasVXM →
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Panel admin</p>
            <h1 className="text-2xl font-semibold">Paquetes de viaje</h1>
            <p className="text-xs text-slate-400 mt-0.5">Solo lectura — gestión migrada a VentasVXM</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/admin/csv/export"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Descargar disponibles CSV
            </a>
            <Link
              href="/admin/csv"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
            >
              CSV
            </Link>
            <Link
              href="/admin/json"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
            >
              JSON
            </Link>
            <span
              title="Gestión migrada a VentasVXM"
              className="rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-slate-500 cursor-not-allowed select-none"
            >
              Nuevo paquete (deshabilitado)
            </span>
            <LogoutButton />
          </div>
        </div>

        <AdminTabs current="paquetes" />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Publicados</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{publishedCount}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Borradores</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{draftCount}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Archivados</p>
            <p className="mt-1 text-2xl font-bold text-slate-700">{archivedCount}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">En oferta</p>
            <p className="mt-1 text-2xl font-bold text-cyan-700">{offerCount}</p>
          </article>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3">Codigo</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Destino</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Oferta</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((travelPackage) => (
                <tr key={travelPackage.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium">{travelPackage.packageCode}</td>
                  <td className="px-4 py-3">{travelPackage.name}</td>
                  <td className="px-4 py-3">{travelPackage.destination}</td>
                  <td className="px-4 py-3">
                    {travelPackage.isOffer && travelPackage.offerPrice ? (
                      <div>
                        <p className="text-xs text-slate-400 line-through">
                          {formatPrice(travelPackage.basePrice, "GTQ")}
                        </p>
                        <p className="font-semibold text-emerald-700">
                          {formatPrice(travelPackage.offerPrice, "GTQ")}
                        </p>
                      </div>
                    ) : (
                      formatPrice(travelPackage.basePrice, "GTQ")
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {travelPackage.isOffer ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Destacado
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">{statusLabel[travelPackage.status]}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400 italic">Gestión en VentasVXM</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
