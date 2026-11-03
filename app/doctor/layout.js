import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentDoctor } from "@/lib/auth-guards";
import { DoctorSidebar } from "@/components/doctor/doctor-sidebar";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DoctorLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "doctor") redirect("/login");

  const doctor = await getCurrentDoctor();

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-clip">
      <div className="contents print:hidden">
        <DoctorSidebar user={{ name: doctor?.fullName ? `Dr. ${doctor.fullName}` : session.user.email, role: "doctor" }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col md:pl-60 print:pl-0">
        <main className="flex-1 min-w-0 w-full">
          {doctor ? (
            children
          ) : (
            // Every doctor page assumes a Doctor row exists for this user.
            <div className="p-4 sm:p-6">
              <EmptyState
                title="No doctor profile"
                text="This account has no doctor profile yet. Ask the clinic administrator to set one up."
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}