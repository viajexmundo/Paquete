"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { TravelPackage } from "@/lib/packages";
import { formatPrice } from "@/lib/packages";

type CotizadorBuilderProps = {
  packages: TravelPackage[];
  agencyName: string;
  agencyLogoUrl: string;
  cooitzaLogoUrl: string;
};

function linesFromText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDateLabel(dateInput: string) {
  if (!dateInput) return "No definida";
  const [yearRaw, monthRaw, dayRaw] = dateInput.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!year || !month || !day) return "No definida";

  return new Intl.DateTimeFormat("es-GT", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

export function CotizadorBuilder({
  packages,
  agencyName,
  agencyLogoUrl,
  cooitzaLogoUrl,
}: CotizadorBuilderProps) {
  const initialPackage = packages[0] ?? null;
  const initialPrice =
    initialPackage && initialPackage.isOffer && initialPackage.offerPrice
      ? initialPackage.offerPrice
      : initialPackage?.basePrice ?? 0;

  const [selectedPackageId, setSelectedPackageId] = useState(initialPackage?.id ?? "");
  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === selectedPackageId) ?? packages[0] ?? null,
    [packages, selectedPackageId],
  );

  const [clientName, setClientName] = useState("");
  const [advisorName, setAdvisorName] = useState("");
  const [advisorPhone, setAdvisorPhone] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [validUntil, setValidUntil] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 6);
    return toInputDate(nextWeek);
  });
  const [travelDateStart, setTravelDateStart] = useState("");
  const [travelDateEnd, setTravelDateEnd] = useState("");
  const [includesText, setIncludesText] = useState(initialPackage?.includes.join("\n") ?? "");
  const [excludesText, setExcludesText] = useState(initialPackage?.excludes.join("\n") ?? "");
  const [notesText, setNotesText] = useState(
    "Tarifa sujeta a cambios y disponibilidad al momento de confirmar reserva.",
  );
  const [flightIncluded, setFlightIncluded] = useState(false);
  const [flightRoute, setFlightRoute] = useState("");
  const [flightItinerary, setFlightItinerary] = useState("");
  const [flightPriceInput, setFlightPriceInput] = useState("");
  const [basePackagePrice, setBasePackagePrice] = useState(initialPrice);

  const includes = useMemo(() => linesFromText(includesText), [includesText]);
  const excludes = useMemo(() => linesFromText(excludesText), [excludesText]);
  const notes = useMemo(() => linesFromText(notesText), [notesText]);
  const flightSegments = useMemo(() => linesFromText(flightItinerary), [flightItinerary]);

  const flightPrice = Number(flightPriceInput || "0");
  const totalPrice = basePackagePrice + (flightIncluded ? flightPrice : 0);
  const issueDate = useMemo(
    () =>
      new Intl.DateTimeFormat("es-GT", {
        dateStyle: "long",
      }).format(new Date()),
    [],
  );

  const validUntilLabel = useMemo(() => formatDateLabel(validUntil), [validUntil]);
  const travelDateStartLabel = useMemo(() => formatDateLabel(travelDateStart), [travelDateStart]);
  const travelDateEndLabel = useMemo(() => formatDateLabel(travelDateEnd), [travelDateEnd]);

  if (!selectedPackage) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
        No hay paquetes publicados para cotizar.
      </div>
    );
  }

  const handlePackageSelection = (packageId: string) => {
    setSelectedPackageId(packageId);
    const nextPackage = packages.find((item) => item.id === packageId);
    if (!nextPackage) return;
    const packagePrice =
      nextPackage.isOffer && nextPackage.offerPrice ? nextPackage.offerPrice : nextPackage.basePrice;
    setIncludesText(nextPackage.includes.join("\n"));
    setExcludesText(nextPackage.excludes.join("\n"));
    setBasePackagePrice(packagePrice);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <aside className="cotizador-controls rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Configuracion de cotizacion</h2>
        <p className="mt-1 text-sm text-slate-600">Completa la informacion y exporta el PDF final.</p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Paquete publicado</span>
            <select
              value={selectedPackage.id}
              onChange={(event) => handlePackageSelection(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {packages.map((travelPackage) => (
                <option key={travelPackage.id} value={travelPackage.id}>
                  {travelPackage.packageCode} - {travelPackage.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Cliente</span>
            <input
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="Nombre del cliente"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Asesor responsable</span>
            <input
              value={advisorName}
              onChange={(event) => setAdvisorName(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="Nombre del asesor"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Telefono del asesor</span>
            <input
              value={advisorPhone}
              onChange={(event) => setAdvisorPhone(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="+502 5555-5555"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Vigencia de cotizacion</span>
            <input
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Fecha inicio de viaje</span>
            <input
              type="date"
              value={travelDateStart}
              onChange={(event) => setTravelDateStart(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Fecha fin de viaje</span>
            <input
              type="date"
              value={travelDateEnd}
              onChange={(event) => setTravelDateEnd(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Viajeros</span>
            <input
              type="number"
              min={1}
              value={travelers}
              onChange={(event) => setTravelers(Math.max(1, Number(event.target.value) || 1))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Precio paquete (GTQ)</span>
            <input
              type="number"
              min={0}
              value={basePackagePrice}
              onChange={(event) => setBasePackagePrice(Math.max(0, Number(event.target.value) || 0))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={flightIncluded}
              onChange={(event) => setFlightIncluded(event.target.checked)}
              className="size-4"
            />
            Incluir cotizacion de vuelo
          </label>

          {flightIncluded ? (
            <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Ruta de vuelo</span>
                <input
                  value={flightRoute}
                  onChange={(event) => setFlightRoute(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="GUA - BOG - GUA"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Itinerario de vuelo (una linea por tramo)</span>
                <textarea
                  value={flightItinerary}
                  onChange={(event) => setFlightItinerary(event.target.value)}
                  className="min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder={"Salida 10:30 / Llegada 13:20\nRegreso 15:00 / Llegada 17:50"}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Precio vuelo (GTQ)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={flightPriceInput}
                  onChange={(event) => {
                    const digitsOnly = event.target.value.replace(/[^\d]/g, "");
                    setFlightPriceInput(digitsOnly);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="0"
                />
              </label>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Incluye (editable)</span>
            <textarea
              value={includesText}
              onChange={(event) => setIncludesText(event.target.value)}
              className="min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">No incluye (editable)</span>
            <textarea
              value={excludesText}
              onChange={(event) => setExcludesText(event.target.value)}
              className="min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Notas comerciales</span>
            <textarea
              value={notesText}
              onChange={(event) => setNotesText(event.target.value)}
              className="min-h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Descargar PDF
        </button>
      </aside>

      <section className="cotizador-print-shell rounded-2xl border border-slate-200 bg-white p-4 sm:p-8">
        <article className="cotizador-print-page mx-auto max-w-[820px] rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <header className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-6">
              <Image src={agencyLogoUrl} alt={`${agencyName} logo`} width={180} height={56} className="h-14 w-auto object-contain" />
              <Image src={cooitzaLogoUrl} alt="Cooitza logo" width={150} height={48} className="h-12 w-auto object-contain" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Cotizacion</p>
              <p className="mt-1 text-sm text-slate-700">Emision: {issueDate}</p>
              <p className="text-sm text-slate-700">Vigente hasta: {validUntilLabel}</p>
            </div>
          </header>

          <section className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cliente</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{clientName || "Consumidor final"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Asesor</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{advisorName || "Equipo comercial"}</p>
              <p className="text-sm text-slate-700">{advisorPhone || "Telefono por confirmar"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Viajeros</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{travelers}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Paquete</p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {selectedPackage.packageCode} - {selectedPackage.name}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fechas de viaje</p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {travelDateStart ? travelDateStartLabel : "Por definir"} -{" "}
                {travelDateEnd ? travelDateEndLabel : "Por definir"}
              </p>
            </div>
          </section>

          <section className="cotizador-print-block mt-6">
            <h2 className="text-xl font-bold text-slate-900">{selectedPackage.destination}</h2>
            <p className="mt-1 text-sm text-slate-600">{selectedPackage.summary}</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{selectedPackage.description}</p>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="cotizador-print-block rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-800">Incluye</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-emerald-950">
                {includes.length > 0 ? (
                  includes.map((item) => <li key={item}>- {item}</li>)
                ) : (
                  <li>- Por confirmar</li>
                )}
              </ul>
            </div>
            <div className="cotizador-print-block rounded-xl border border-rose-200 bg-rose-50 p-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-rose-800">No incluye</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-rose-950">
                {excludes.length > 0 ? (
                  excludes.map((item) => <li key={item}>- {item}</li>)
                ) : (
                  <li>- Por confirmar</li>
                )}
              </ul>
            </div>
          </section>

          <section className="cotizador-print-block mt-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">Itinerario del paquete</h3>
            <div className="mt-3 space-y-2">
              {selectedPackage.itinerary.map((day) => (
                <div key={`${day.day}-${day.title}`} className="cotizador-print-block rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Dia {day.day}: {day.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{day.description}</p>
                </div>
              ))}
            </div>
          </section>

          {flightIncluded ? (
            <section className="cotizador-print-block mt-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-900">Cotizacion de vuelo</h3>
              <p className="mt-2 text-sm text-slate-800">Ruta: {flightRoute || "Por definir"}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {flightSegments.length > 0 ? (
                  flightSegments.map((segment) => <li key={segment}>- {segment}</li>)
                ) : (
                  <li>- Itinerario pendiente</li>
                )}
              </ul>
              <p className="mt-3 text-sm font-semibold text-cyan-900">
                Precio vuelo: {formatPrice(flightPrice, "GTQ")}
              </p>
            </section>
          ) : null}

          <section className="cotizador-print-block mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">Resumen de inversion</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>Paquete base</span>
                <span className="font-semibold">{formatPrice(basePackagePrice, "GTQ")}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Vuelo</span>
                <span className="font-semibold">{flightIncluded ? formatPrice(flightPrice, "GTQ") : "No incluido"}</span>
              </div>
              <div className="h-px bg-slate-300" />
              <div className="flex items-center justify-between gap-2 text-base font-bold">
                <span>Total cotizado</span>
                <span>{formatPrice(totalPrice, "GTQ")}</span>
              </div>
            </div>
          </section>

          <section className="cotizador-print-block mt-6 rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">Notas y condiciones</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
              {notes.length > 0 ? (
                notes.map((note) => <li key={note}>- {note}</li>)
              ) : (
                <li>- Sin notas adicionales.</li>
              )}
            </ul>
          </section>
        </article>
      </section>
    </div>
  );
}
