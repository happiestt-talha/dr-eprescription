import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReceptionistSidebar } from "@/components/receptionist/receptionist-sidebar";

export default async function ReceptionistLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role?.toLowerCase() !== "receptionist") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row w-full overflow-x-hidden">
      <ReceptionistSidebar user={session.user} />
      <main className="flex-1 min-w-0 w-full overflow-x-hidden p-4 sm:p-6">{children}</main>
    </div>
  );
}
