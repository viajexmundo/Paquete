import { PackageForm } from "@/components/package-form";
import { createPackageAction } from "../../actions";

export default function NewPackagePage() {
  return <PackageForm title="Crear paquete" submitLabel="Guardar paquete" action={createPackageAction} />;
}
