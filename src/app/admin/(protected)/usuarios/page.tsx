import Link from "next/link";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminTabs } from "@/components/admin-tabs";
import { LogoutButton } from "@/components/logout-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createUserAction, updateUserAccessAction } from "../actions";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    redirect("/admin/login");
  }

  const currentUser =
    (session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            role: true,
          },
        })
      : null) ??
    (session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email.toLowerCase() },
          select: {
            id: true,
            role: true,
          },
        })
      : null);

  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== UserRole.ADMIN) {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      role: true,
      canManagePackages: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Panel admin</p>
            <h1 className="text-2xl font-semibold">Gestion de usuarios</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
            >
              Ver paquetes
            </Link>
            <LogoutButton />
          </div>
        </div>

        <AdminTabs current="usuarios" />

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold">Crear usuario</h2>
          <p className="mt-1 text-sm text-slate-600">Crea o actualiza un usuario por correo para acceso al admin.</p>

          <form action={createUserAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Correo</span>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Contrasena</span>
              <input
                name="password"
                type="password"
                minLength={8}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Rol</span>
              <select name="role" defaultValue="EDITOR" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="EDITOR">EDITOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="canManagePackages" defaultChecked className="size-4" />
              Gestionar paquetes
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked readOnly className="size-4" />
              CSV/Usuarios solo para ADMIN
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Guardar usuario
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Permisos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3">Accion</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-200 align-top">
                  <td className="px-4 py-3" colSpan={6}>
                    <form action={updateUserAccessAction} className="grid gap-3 md:grid-cols-6 md:items-center">
                      <input type="hidden" name="userId" value={user.id} />
                      <div className="md:col-span-2">
                        <p className="font-semibold">{user.email}</p>
                        <p className="text-slate-600">Usuario del sistema</p>
                      </div>
                      <div>
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        >
                          <option value="EDITOR">EDITOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                      <div className="space-y-1 text-xs">
                        <label className="block">
                          <input
                            type="checkbox"
                            name="canManagePackages"
                            defaultChecked={user.canManagePackages}
                            className="mr-2 size-3.5"
                          />
                          Paquetes
                        </label>
                        <p className="text-slate-500">CSV y Usuarios quedan habilitados automaticamente en ADMIN.</p>
                      </div>
                      <div className="text-xs text-slate-600">
                        {new Intl.DateTimeFormat("es-GT", {
                          dateStyle: "medium",
                        }).format(user.createdAt)}
                      </div>
                      <div>
                        <button
                          type="submit"
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-100"
                        >
                          Guardar
                        </button>
                      </div>
                    </form>
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
