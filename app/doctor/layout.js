import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DoctorLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role?.toLowerCase() !== "doctor") {
    redirect("/login");
  }

  return <>{children}</>;
}