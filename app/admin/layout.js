import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/login");

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-clip">
      <div className="contents print:hidden">
        <AdminSidebar user={{ name: session.user.email, role: "admin" }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col md:pl-60 print:pl-0">
        <main className="flex-1 min-w-0 w-full">{children}</main>
      </div>
    </div>
  );
}