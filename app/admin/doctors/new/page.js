import { DoctorForm } from "@/components/admin/doctor-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function NewDoctorPage() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-4 sm:space-y-6">
      <Breadcrumbs
        segments={[
          { label: "Doctors", href: "/admin/doctors" },
          { label: "Add Doctor" },
        ]}
      />
      <h1 className="text-xl sm:text-2xl font-semibold">Add Doctor</h1>
      <DoctorForm />
    </div>
  );
}