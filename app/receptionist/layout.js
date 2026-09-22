import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ReceptionistSidebar } from "@/components/receptionist/receptionist-sidebar";
import { TopBar } from "@/components/ui/top-bar";

export default async function ReceptionistLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "receptionist") redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row w-full overflow-x-hidden">
      <ReceptionistSidebar />
      <div className="flex-1 min-w-0 w-full overflow-x-hidden flex flex-col">
        <TopBar
          title="Reception Desk"
          userName={session.user.email?.split("@")[0] || "Receptionist"}
          userRole="receptionist"
        />
        <main className="flex-1 min-w-0 w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}