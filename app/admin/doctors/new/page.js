import { DoctorForm } from "@/components/admin/doctor-form";

export default function NewDoctorPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Add Doctor</h1>
      <DoctorForm />
    </div>
  );
}