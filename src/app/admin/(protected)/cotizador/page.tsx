import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminTabs } from "@/components/admin-tabs";
import { CotizadorBuilder } from "@/components/cotizador-builder";
import { LogoutButton } from "@/components/logout-button";
import { auth } from "@/lib/auth";
import { appConfig } from "@/lib/config";
import { prisma } from "@/lib/db/prisma";
import { getPublishedPackages } from "@/lib/db/package-repository";

export default async function AdminCotizadorPage() {
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

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.COTIZADOR) {
    redirect("/admin");
  }

  const packages = await getPublishedPackages();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 sm:py-10">
      <section className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="cotizador-controls flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Panel admin</p>
            <h1 className="text-2xl font-semibold">Cotizador profesional</h1>
          </div>
          <div className="flex items-center gap-2">
            <LogoutButton />
          </div>
        </div>

        <div className="cotizador-controls">
          <AdminTabs current="cotizador" />
        </div>

        <div className="mt-6">
          <CotizadorBuilder
            packages={packages}
            agencyName={appConfig.agencyName}
            agencyLogoUrl={appConfig.agencyLogoUrl}
            cooitzaLogoUrl="/COOITZA-LOGO-WEB-1.png"
          />
        </div>
      </section>
    </main>
  );
}
