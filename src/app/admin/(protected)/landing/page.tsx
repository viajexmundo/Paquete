import Image from "next/image";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminTabs } from "@/components/admin-tabs";
import { LogoutButton } from "@/components/logout-button";
import { auth } from "@/lib/auth";
import { getActiveLandingVariant } from "@/lib/landing";
import { prisma } from "@/lib/db/prisma";
import { updateLandingVariantAction } from "../actions";

export default async function AdminLandingPage() {
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

  if (user.role !== UserRole.ADMIN && !user.canManagePackages) {
    redirect("/admin/usuarios");
  }

  const activeVariant = await getActiveLandingVariant();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Panel admin</p>
            <h1 className="text-2xl font-semibold">Configuracion de landing</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
            >
              Ver landing
            </Link>
            <LogoutButton />
          </div>
        </div>

        <AdminTabs current="landing" />

        <form action={updateLandingVariantAction} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold">Landing activa por subdominio</h2>
          <p className="mt-1 text-sm text-slate-600">
            Selecciona la version que se mostrara en la portada principal.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="block cursor-pointer rounded-xl border border-slate-300 bg-white p-4 transition hover:border-slate-400">
              <div className="flex items-center gap-2">
                <input type="radio" name="variant" value="default" defaultChecked={activeVariant === "default"} />
                <span className="text-sm font-semibold">Default Viajexmundo</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">Landing original enfocada en paquetes de viaje.</p>
            </label>

            <label className="block cursor-pointer rounded-xl border border-yellow-300 bg-[#fff9db] p-4 transition hover:border-yellow-400">
              <div className="flex items-center gap-2">
                <input type="radio" name="variant" value="cooitza" defaultChecked={activeVariant === "cooitza"} />
                <span className="text-sm font-semibold text-[#0b4ea2]">Cooitza x Viajexmundo</span>
              </div>
              <p className="mt-2 text-sm text-[#2f466b]">
                Landing personalizada con identidad cooperativa (amarillo + azul) y cobranding.
              </p>
              <div className="relative mt-3 h-14 w-40">
                <Image src="/COOITZA-LOGO-WEB-1.png" alt="Logo Cooitza" fill className="object-contain object-left" />
              </div>
            </label>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Version activa actual: <strong>{activeVariant === "cooitza" ? "Cooitza x Viajexmundo" : "Default"}</strong>
            </p>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Guardar seleccion
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
