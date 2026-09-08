import { redirect } from "next/navigation";
import { auth } from "@/auth";

const roleHome = {
  admin: "/admin/dashboard",
  doctor: "/doctor/patients",
  patient: "/patient",
  receptionist: "/receptionist",
};

export default async function Home() {
  const session = await auth();

  if (!session) redirect("/login");
  redirect(roleHome[session.user.role] ?? "/login");
}