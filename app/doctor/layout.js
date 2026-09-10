import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DoctorSidebar } from "@/components/doctor/doctor-sidebar";

export default async function DoctorLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "doctor") redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row w-full overflow-x-hidden">
      <DoctorSidebar />
      <main className="flex-1 min-w-0 w-full overflow-x-hidden">{children}</main>
    </div>
  );
}