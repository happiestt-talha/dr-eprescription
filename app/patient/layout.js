import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PatientTopBar } from "@/components/patients/patient-top-bar";

export default async function PatientLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "patient") redirect("/login");

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      <PatientTopBar />
      <main className="flex-1 min-w-0 w-full overflow-x-hidden">{children}</main>
    </div>
  );
}