import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { auth } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Acceso admin</p>
        <h1 className="mt-2 text-2xl font-semibold">Iniciar sesion</h1>
        <p className="mt-2 text-sm text-slate-600">Usa tu usuario interno para administrar paquetes.</p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
