import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ReceptionistSidebar } from "@/components/receptionist/receptionist-sidebar";

export default async function ReceptionistLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "receptionist") redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row w-full overflow-x-hidden">
      <ReceptionistSidebar />
      <main className="flex-1 min-w-0 w-full overflow-x-hidden">{children}</main>
    </div>
  );
}