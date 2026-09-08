import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PatientSidebar } from "@/components/patient/patient-sidebar";

export default async function PatientLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role?.toLowerCase() !== "patient") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row w-full overflow-x-hidden">
      <PatientSidebar user={session.user} />
      <main className="flex-1 min-w-0 w-full overflow-x-hidden p-4 sm:p-6">{children}</main>
    </div>
  );
}
