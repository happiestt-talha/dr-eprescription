import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DoctorSidebar } from "@/components/doctor/doctor-sidebar";

export default async function DoctorLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role?.toLowerCase() !== "doctor") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row w-full overflow-x-hidden">
      <DoctorSidebar user={session.user} />
      <main className="flex-1 min-w-0 w-full overflow-x-hidden">{children}</main>
    </div>
  );
}