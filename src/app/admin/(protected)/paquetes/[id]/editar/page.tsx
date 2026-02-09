import { notFound } from "next/navigation";
import { PackageForm } from "@/components/package-form";
import { prisma } from "@/lib/db/prisma";
import { updatePackageAction } from "../../../actions";

function linesFromJson(value: unknown) {
  if (!Array.isArray(value)) {
    return "";
  }
  return value.join("\n");
}

function itineraryFromJson(value: unknown) {
  if (!Array.isArray(value)) {
    return [{ day: 1, title: "Dia 1", description: "" }];
  }

  const mapped = value.map((item, index) => {
    const step = item as { title?: string; description?: string; day?: number };
    return {
      day: step.day ?? index + 1,
      title: step.title ?? `Dia ${index + 1}`,
      description: step.description ?? "",
    };
  });

  return mapped.length > 0 ? mapped : [{ day: 1, title: "Dia 1", description: "" }];
}

type EditPackagePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPackagePage({ params }: EditPackagePageProps) {
  const { id } = await params;
  const travelPackage = await prisma.package.findUnique({ where: { id } });

  if (!travelPackage) {
    notFound();
  }

  const action = updatePackageAction.bind(null, travelPackage.id);

  return (
    <PackageForm
      title={`Editar ${travelPackage.name}`}
      submitLabel="Guardar cambios"
      action={action}
      defaultValues={{
        packageCode: travelPackage.packageCode,
        name: travelPackage.name,
        destination: travelPackage.destination,
        durationDays: travelPackage.durationDays,
        basePrice: travelPackage.basePrice,
        offerPrice: travelPackage.offerPrice,
        isOffer: travelPackage.isOffer,
        offerLabel: travelPackage.offerLabel,
        summary: travelPackage.summary,
        description: travelPackage.description,
        coverImageUrl: travelPackage.coverImageUrl,
        gallery: linesFromJson(travelPackage.gallery),
        includes: linesFromJson(travelPackage.includes),
        excludes: linesFromJson(travelPackage.excludes),
        itinerary: itineraryFromJson(travelPackage.itinerary),
        status: travelPackage.status,
      }}
    />
  );
}
