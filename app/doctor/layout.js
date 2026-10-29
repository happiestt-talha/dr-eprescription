import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentDoctor } from "@/lib/auth-guards";
import { DoctorSidebar } from "@/components/doctor/doctor-sidebar";
import { TopBar } from "@/components/ui/top-bar";

export default async function DoctorLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "doctor") redirect("/login");

  const doctor = await getCurrentDoctor();

  return (
    <div className="flex min-h-screen flex-col md:flex-row w-full overflow-x-hidden">
      <div className="contents print:hidden">
        <DoctorSidebar />
      </div>
      <div className="flex-1 min-w-0 w-full overflow-x-hidden flex flex-col">
        <div className="contents print:hidden">
          <TopBar
            title="Doctor Portal"
            userName={doctor?.fullName || session.user.email?.split("@")[0] || "Doctor"}
            userRole="doctor"
          />
        </div>
        <main className="flex-1 min-w-0 w-full overflow-x-hidden">
          {doctor ? (
            children
          ) : (
            // Every doctor page assumes a Doctor row exists for this user.
            <div className="p-6 max-w-md">
              <h1 className="text-lg font-semibold">Doctor profile not set up</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your account has no doctor profile yet. Please contact an administrator.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}