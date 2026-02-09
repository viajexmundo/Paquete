import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user || !session.user.isActive) {
    redirect("/admin/login");
  }

  return children;
}
