import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ReceptionistSidebar } from "@/components/receptionist/receptionist-sidebar";
import { prisma } from "@/lib/db";

export default async function ReceptionistLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "receptionist") redirect("/login");

  const receptionist = await prisma.receptionist.findUnique({
    where: { userId: session.user.id },
    select: { fullName: true },
  });

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-clip">
      <div className="contents print:hidden">
        <ReceptionistSidebar user={{ name: receptionist?.fullName || session.user.email, role: "receptionist" }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col md:pl-60 print:pl-0">
        <main className="flex-1 min-w-0 w-full">{children}</main>
      </div>
    </div>
  );
}