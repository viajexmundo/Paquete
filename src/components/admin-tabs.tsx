import Link from "next/link";

type AdminTab = "paquetes" | "cotizador" | "csv" | "json" | "usuarios" | "landing";

const tabStyles: Record<AdminTab, string> = {
  paquetes: "Paquetes",
  cotizador: "Cotizador",
  landing: "Landing",
  csv: "CSV",
  json: "JSON",
  usuarios: "Usuarios",
};

export function AdminTabs({ current, visibleTabs }: { current: AdminTab; visibleTabs?: AdminTab[] }) {
  const tabs = visibleTabs ?? (Object.keys(tabStyles) as AdminTab[]);

  return (
    <div className="mt-5 flex gap-2">
      {tabs.map((tab) => {
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
