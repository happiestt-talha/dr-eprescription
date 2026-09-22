import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { DoctorSidebar } from "@/components/doctor/doctor-sidebar";
import { TopBar } from "@/components/ui/top-bar";

export default async function DoctorLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "doctor") redirect("/login");

  // Fetch doctor name for the top bar greeting
  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    select: { fullName: true },
  });

  return (
    <div className="flex min-h-screen flex-col md:flex-row w-full overflow-x-hidden">
      <DoctorSidebar />
      <div className="flex-1 min-w-0 w-full overflow-x-hidden flex flex-col">
        <TopBar
          title="Doctor Portal"
          userName={doctor?.fullName || session.user.email?.split("@")[0] || "Doctor"}
          userRole="doctor"
        />
        <main className="flex-1 min-w-0 w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}