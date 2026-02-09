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

const steps = ["🧱 Basico", "💰 Precios", "🖼️ Imagenes", "📝 Contenido", "🚀 Publicacion"] as const;

function stepClass(active: boolean) {
  return active ? "contents" : "hidden";
}

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
  const [submitGuard, setSubmitGuard] = useState(false);

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

    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("No se pudo subir la imagen");
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

        <form
          action={action}
          onSubmit={(event) => {
            if (step < steps.length - 1) {
              event.preventDefault();
              setStep((prev) => Math.min(steps.length - 1, prev + 1));
            }
          }}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
          <input type="hidden" name="gallery" value={galleryLines} />
          <input type="hidden" name="itinerary" value={itinerarySerialized} />

          <div className={stepClass(step === 0)}>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Codigo</span>
              <input
                name="packageCode"
                defaultValue={values.packageCode}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="PKG-007"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Nombre</span>
              <input
                name="name"
                defaultValue={values.name}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Destino</span>
              <input
                name="destination"
                defaultValue={values.destination}
                required
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
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium">Resumen</span>
              <textarea
                name="summary"
                defaultValue={values.summary}
                required
                className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium">Descripcion</span>
              <textarea
                name="description"
                defaultValue={values.description}
                required
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <div className={stepClass(step === 1)}>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">💰 Precio base (GTQ)</span>
              <input
                name="basePrice"
                type="number"
                min={1}
                defaultValue={values.basePrice}
                required
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
              <span className="mb-1 block text-sm font-medium">🏷️ Precio oferta (GTQ)</span>
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

          <div className={stepClass(step === 2)}>
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-2xl font-semibold">🖼️ Portada</h3>
              <p className="mt-1 text-sm text-slate-600">Sube una imagen de portada desde tu equipo.</p>
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
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#3C4F66] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#324356]"
              >
                Subir foto de portada
              </label>
              <p className="mt-2 text-xs text-slate-500 break-all">Portada actual: {coverImageUrl || "(sin portada)"}</p>
            </div>

            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-2xl font-semibold">📸 Galeria</h3>
              <p className="mt-1 text-sm text-slate-600">Puedes subir varias imagenes al mismo tiempo.</p>
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
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#3C4F66] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#324356]"
              >
                Subir fotos de galeria
              </label>
              {galleryUrls.length > 0 ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-600">
                  {galleryUrls.map((url) => (
                    <li key={url} className="break-all">{url}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Aun no has subido imagenes de galeria.</p>
              )}
            </div>

            {isUploading ? <p className="md:col-span-2 text-sm text-cyan-700">Subiendo imagen...</p> : null}
            {uploadError ? <p className="md:col-span-2 text-sm text-red-600">{uploadError}</p> : null}
          </div>

          <div className={stepClass(step === 3)}>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium">✅ Incluye (una linea por item)</span>
              <textarea
                name="includes"
                defaultValue={values.includes}
                required
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium">❌ No incluye (una linea por item)</span>
              <textarea
                name="excludes"
                defaultValue={values.excludes}
                required
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">🗺️ Itinerario por dia</h3>
                  <p className="text-sm text-slate-600">Agrega y edita un bloque por cada dia del viaje.</p>
                </div>
                <button
                  type="button"
                  onClick={addDay}
                  className="rounded-lg bg-[#3C4F66] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#324356]"
                >
                  ➕ Anadir dia
                </button>
              </div>

              <div className="space-y-3">
                {itineraryDays.map((day, index) => (
                  <details key={index} className="rounded-lg border border-slate-200 bg-white p-3" open>
                    <summary className="cursor-pointer font-semibold text-slate-800">📅 Dia {day.day}</summary>
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
                          🗑️ Eliminar dia
                        </button>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <div className={stepClass(step === 4)}>
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

          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
              disabled={step === 0}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              Anterior
            </button>

            {step < steps.length - 1 ? (
              <button
                key="next-step"
                type="button"
                onClick={() => {
                  setStep((prev) => {
                    const nextStep = Math.min(steps.length - 1, prev + 1);
                    if (nextStep === steps.length - 1) {
                      setSubmitGuard(true);
                      setTimeout(() => setSubmitGuard(false), 350);
                    }
                    return nextStep;
                  });
                }}
                className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 sm:w-auto"
              >
                Siguiente
              </button>
            ) : (
              <button
                key="submit-step"
                type="submit"
                disabled={isUploading || !coverImageUrl || itineraryDays.length === 0 || submitGuard}
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
