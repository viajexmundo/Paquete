"use client";

import { useMemo, useState, useTransition } from "react";
import { PackageStatus } from "@prisma/client";

type ItineraryDay = {
  day: number;
  title: string;
  description: string;
};

type PackageFormValues = {
  packageCode: string;
  name: string;
  destination: string;
  durationDays: number;
  basePrice: number;
  offerPrice: number | null;
  isOffer: boolean;
  offerLabel: string | null;
  summary: string;
  description: string;
  coverImageUrl: string;
  gallery: string;
  includes: string;
  excludes: string;
  itinerary: ItineraryDay[];
  status: PackageStatus;
};

type PackageFormProps = {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => void;
  defaultValues?: PackageFormValues;
};

const emptyValues: PackageFormValues = {
  packageCode: "",
  name: "",
  destination: "",
  durationDays: 3,
  basePrice: 5000,
  offerPrice: null,
  isOffer: false,
  offerLabel: "Oferta limitada",
  summary: "",
  description: "",
  coverImageUrl: "",
  gallery: "",
  includes: "",
  excludes: "",
  itinerary: [{ day: 1, title: "Llegada", description: "Actividad del primer dia" }],
  status: "DRAFT",
};

const steps = ["Basico", "Precios", "Imagenes", "Contenido", "Publicacion"] as const;
const maxUploadBytesPerFile = 4 * 1024 * 1024;
const maxUploadFilesPerRequest = 8;

function normalizeDays(days: ItineraryDay[]) {
  return days.map((item, index) => ({
    day: index + 1,
    title: item.title,
    description: item.description,
  }));
}

export function PackageForm({ title, submitLabel, action, defaultValues }: PackageFormProps) {
  const values = defaultValues ?? emptyValues;
  const [step, setStep] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState(values.coverImageUrl);
  const [galleryLines, setGalleryLines] = useState(values.gallery);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>(
    values.itinerary.length > 0 ? normalizeDays(values.itinerary) : emptyValues.itinerary,
  );
  const [isUploading, startUploading] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const itinerarySerialized = useMemo(
    () =>
      itineraryDays
        .map((day) => `${day.title.trim() || `Dia ${day.day}`} | ${day.description.trim() || "Actividad por definir"}`)
        .join("\n"),
    [itineraryDays],
  );

  const galleryUrls = useMemo(
    () =>
      galleryLines
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [galleryLines],
  );

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return [] as string[];

    if (files.length > maxUploadFilesPerRequest) {
      throw new Error(`Puedes subir hasta ${maxUploadFilesPerRequest} imagenes por carga`);
    }

    const formData = new FormData();
    for (const file of Array.from(files)) {
      if (file.size > maxUploadBytesPerFile) {
        throw new Error(`La imagen "${file.name}" supera 4MB`);
      }
      formData.append("files", file);
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "No se pudo subir la imagen");
    }

    const data = (await response.json()) as { urls: string[] };
    return data.urls;
  }

  function addDay() {
    setItineraryDays((prev) => [...prev, { day: prev.length + 1, title: `Dia ${prev.length + 1}`, description: "" }]);
  }

  function removeDay(index: number) {
    setItineraryDays((prev) => {
      const copy = prev.filter((_, dayIndex) => dayIndex !== index);
      return normalizeDays(copy.length > 0 ? copy : [{ day: 1, title: "Dia 1", description: "" }]);
    });
  }

  function updateDay(index: number, key: "title" | "description", value: string) {
    setItineraryDays((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  }

  function goNext() {
    setStep((prev) => Math.min(steps.length - 1, prev + 1));
  }

  function goPrev() {
    setStep((prev) => Math.max(0, prev - 1));
  }

  function showStep(n: number) {
    return { display: step === n ? undefined : "none" } as const;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 sm:py-10">
      <section className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                index === step
                  ? "bg-slate-900 text-white"
                  : index < step
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>

        <form action={action} className="mt-6 space-y-6">
          <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
          <input type="hidden" name="gallery" value={galleryLines} />
          <input type="hidden" name="itinerary" value={itinerarySerialized} />

          {/* Step 0: Basico */}
          <div style={showStep(0)} className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Codigo</span>
              <input
                name="packageCode"
                defaultValue={values.packageCode}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="PKG-007"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Nombre</span>
              <input
                name="name"
                defaultValue={values.name}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Destino</span>
              <input
                name="destination"
                defaultValue={values.destination}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Duracion (dias)</span>
              <input
                name="durationDays"
                type="number"
                min={1}
                defaultValue={values.durationDays}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium">Resumen</span>
              <textarea
                name="summary"
                defaultValue={values.summary}
                className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium">Descripcion</span>
              <textarea
                name="description"
                defaultValue={values.description}
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          {/* Step 1: Precios */}
          <div style={showStep(1)} className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Precio base (GTQ)</span>
              <input
                name="basePrice"
                type="number"
                min={1}
                defaultValue={values.basePrice}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Tiene oferta</span>
              <select
                name="isOffer"
                defaultValue={values.isOffer ? "true" : "false"}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="false">No</option>
                <option value="true">Si</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Precio oferta (GTQ)</span>
              <input
                name="offerPrice"
                type="number"
                min={1}
                defaultValue={values.offerPrice ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Etiqueta oferta</span>
              <input
                name="offerLabel"
                defaultValue={values.offerLabel ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Oferta de temporada"
              />
            </label>
          </div>

          {/* Step 2: Imagenes */}
          <div style={showStep(2)} className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-xl font-semibold">Portada</h3>
              <p className="mt-1 text-sm text-slate-600">Pega una URL de imagen o sube un archivo (max 4MB).</p>
              <input
                type="text"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="mt-3 flex items-center gap-3">
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="hidden"
                  onChange={(event) => {
                    startUploading(async () => {
                      try {
                        setUploadError(null);
                        const urls = await uploadFiles(event.target.files);
                        if (urls[0]) {
                          setCoverImageUrl(urls[0]);
                        }
                      } catch (error) {
                        setUploadError((error as Error).message);
                      }
                    });
                  }}
                />
                <label
                  htmlFor="cover-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#3C4F66] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#324356]"
                >
                  O subir archivo
                </label>
              </div>
              {coverImageUrl && (
                <p className="mt-2 text-xs text-emerald-600 break-all">Portada: {coverImageUrl}</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-xl font-semibold">Galeria</h3>
              <p className="mt-1 text-sm text-slate-600">
                Pega URLs de imagenes (una por linea) o sube archivos (max 4MB c/u, hasta 8 por carga).
              </p>
              <textarea
                value={galleryLines}
                onChange={(e) => setGalleryLines(e.target.value)}
                placeholder={"https://ejemplo.com/foto1.jpg\nhttps://ejemplo.com/foto2.jpg"}
                className="mt-3 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="mt-3">
                <input
                  id="gallery-upload"
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="hidden"
                  onChange={(event) => {
                    startUploading(async () => {
                      try {
                        setUploadError(null);
                        const urls = await uploadFiles(event.target.files);
                        setGalleryLines((prev) => {
                          const merged = [...new Set([...prev.split("\n"), ...urls].map((line) => line.trim()).filter(Boolean))];
                          return merged.join("\n");
                        });
                      } catch (error) {
                        setUploadError((error as Error).message);
                      }
                    });
                  }}
                />
                <label
                  htmlFor="gallery-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#3C4F66] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#324356]"
                >
                  O subir archivos
                </label>
              </div>
              {galleryUrls.length > 0 && (
                <p className="mt-2 text-xs text-emerald-600">{galleryUrls.length} imagen(es) en galeria</p>
              )}
            </div>

            {isUploading && <p className="text-sm text-cyan-700">Subiendo imagen...</p>}
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          </div>

          {/* Step 3: Contenido */}
          <div style={showStep(3)} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Incluye (una linea por item)</span>
              <textarea
                name="includes"
                defaultValue={values.includes}
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">No incluye (una linea por item)</span>
              <textarea
                name="excludes"
                defaultValue={values.excludes}
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">Itinerario por dia</h3>
                  <p className="text-sm text-slate-600">Agrega y edita un bloque por cada dia del viaje.</p>
                </div>
                <button
                  type="button"
                  onClick={addDay}
                  className="rounded-lg bg-[#3C4F66] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#324356]"
                >
                  Anadir dia
                </button>
              </div>

              <div className="space-y-3">
                {itineraryDays.map((day, index) => (
                  <details key={index} className="rounded-lg border border-slate-200 bg-white p-3" open>
                    <summary className="cursor-pointer font-semibold text-slate-800">Dia {day.day}</summary>
                    <div className="mt-3 space-y-3">
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium">Titulo</span>
                        <input
                          value={day.title}
                          onChange={(event) => updateDay(index, "title", event.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          placeholder={`Dia ${day.day}`}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium">Descripcion</span>
                        <textarea
                          value={day.description}
                          onChange={(event) => updateDay(index, "description", event.target.value)}
                          className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
                          placeholder="Describe actividades de este dia"
                        />
                      </label>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeDay(index)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Eliminar dia
                        </button>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* Step 4: Publicacion */}
          <div style={showStep(4)} className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Estado</span>
              <select
                name="status"
                defaultValue={values.status}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicado</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2">
              Revisa datos clave antes de guardar: codigo, precio, portada y estado de publicacion.
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 0}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              Anterior
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 sm:w-auto"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={isUploading}
                className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {submitLabel}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
