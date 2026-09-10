import { redirect } from "next/navigation";

export default function PatientRoot() {
  redirect("/patient/prescriptions");
}