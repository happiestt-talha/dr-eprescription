import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { ROLE_HOME } from "@/lib/roles";

export const metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const required = Boolean(session.user.mustChangePassword);
  return <ChangePasswordForm required={required} home={ROLE_HOME[session.user.role] ?? "/"} />;
}
