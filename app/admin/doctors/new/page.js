import { DoctorForm } from "@/components/admin/doctor-form";

export default function NewDoctorPage() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold">Add Doctor</h1>
      <DoctorForm />
    </div>
  );
}