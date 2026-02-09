"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") ?? "");
        const password = String(form.get("password") ?? "");

        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        setIsSubmitting(false);

        if (result?.error) {
          setError("Credenciales invalidas");
          return;
        }

        window.location.href = "/admin";
      }}
    >
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-cyan-200 focus:ring"
          placeholder="admin@agencia.com"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Contrasena</span>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-cyan-200 focus:ring"
          placeholder="********"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
