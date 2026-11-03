import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PatientTopBar } from "@/components/patients/patient-top-bar";
import { prisma } from "@/lib/db";

export default async function PatientLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "patient") redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    select: { fullName: true },
  });

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-clip">
      <div className="contents print:hidden">
        <PatientTopBar name={patient?.fullName || session.user.email} />
      </div>
      <main className="flex-1 min-w-0 w-full">{children}</main>
    </div>
  );
}