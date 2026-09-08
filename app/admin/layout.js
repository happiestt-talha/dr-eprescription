import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/login");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row w-full overflow-x-hidden">
      <AdminSidebar />
      <main className="flex-1 min-w-0 w-full overflow-x-hidden">{children}</main>
    </div>
  );
}