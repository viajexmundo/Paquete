"use client";

import Image from "next/image";
import Link from "next/link";
import { appConfig } from "@/lib/config";

export function PublicHome() {
  return (
    <main className="min-h-screen bg-[#0f172a] text-white">
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/hero-wing.svg" alt="" fill className="object-cover" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f172ab3] via-[#243b5acc] to-[#0f172af2]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#93C5FD3d_0%,transparent_45%),radial-gradient(circle_at_80%_15%,#DBEAFE2f_0%,transparent_40%)]" />
        </div>

        <Image
          src="/plane-icon.svg"
          alt=""
          width={84}
          height={84}
          className="plane-bounce pointer-events-none absolute left-0 top-0 z-10 opacity-90 will-change-transform"
        />
        <Image
          src="/plane-icon.svg"
          alt=""
          width={110}
          height={110}
          className="plane-bounce-alt pointer-events-none absolute left-0 top-0 z-10 opacity-80 will-change-transform"
        />

        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-between px-5 pb-10 pt-6 sm:px-8 sm:pt-8">
          <header className="flex items-center justify-between rounded-2xl border border-white/20 bg-black/20 px-4 py-3 backdrop-blur-md">
            <div className="relative h-20 w-72 sm:h-24 sm:w-80">
              <Image src={appConfig.agencyLogoUrl} alt={appConfig.agencyName} fill className="object-contain" sizes="320px" />
            </div>
            <Link
              href="/paquetes"
              className="rounded-xl bg-white px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-[#3C4F66] transition hover:bg-slate-100"
            >
              Ver paquetes
            </Link>
          </header>

          <div className="mx-auto w-full max-w-4xl py-8 text-center sm:py-12">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-slate-200">Viajexmundo</p>
            <h1 className="text-5xl font-black uppercase leading-[0.9] drop-shadow-2xl sm:text-7xl md:text-8xl">
              Viaja
              <br />
              Confiado
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-100 sm:text-2xl">
              Paquetes diseñados a medida, asesoría experta y experiencias memorables desde el primer contacto.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/paquetes"
                className="rounded-2xl bg-[#ef4444] px-7 py-4 text-base font-extrabold uppercase tracking-wide text-white shadow-[0_20px_40px_-15px_rgba(239,68,68,0.6)] transition hover:translate-y-[-1px] hover:bg-[#dc2626]"
              >
                Viajemos! (toca aqui)
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/20 bg-black/25 px-5 py-4 text-center backdrop-blur">
              <p className="text-lg font-extrabold sm:text-xl">No esperes el momento perfecto, crea el viaje perfecto.</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-black/25 px-5 py-4 text-center backdrop-blur">
              <p className="text-lg font-extrabold sm:text-xl">Viajar te cambia el mapa y también la forma de ver tu vida.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
