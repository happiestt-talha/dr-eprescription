import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { TopBar } from "@/components/ui/top-bar";

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/login");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row w-full overflow-x-hidden">
      <AdminSidebar />
      <div className="flex-1 min-w-0 w-full overflow-x-hidden flex flex-col">
        <TopBar
          title="Admin Panel"
          userName={session.user.email?.split("@")[0] || "Admin"}
          userRole="admin"
        />
        <main className="flex-1 min-w-0 w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}