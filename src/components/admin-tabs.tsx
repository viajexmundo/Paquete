import Link from "next/link";

type AdminTab = "paquetes" | "csv" | "usuarios";

const tabStyles: Record<AdminTab, string> = {
  paquetes: "Paquetes",
  csv: "CSV",
  usuarios: "Usuarios",
};

export function AdminTabs({ current }: { current: AdminTab }) {
  return (
    <div className="mt-5 flex gap-2">
      {(Object.keys(tabStyles) as AdminTab[]).map((tab) => {
        const href = tab === "paquetes" ? "/admin" : `/admin/${tab}`;
        const isActive = tab === current;

        return (
          <Link
            key={tab}
            href={href}
            className={
              isActive
                ? "rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                : "rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            }
          >
            {tabStyles[tab]}
          </Link>
        );
      })}
    </div>
  );
}
