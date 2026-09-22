import { PatientForm } from "@/components/patients/patient-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function NewPatientPage() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl w-full min-w-0 space-y-4 sm:space-y-6">
      <Breadcrumbs
        segments={[
          { label: "Patients", href: "/receptionist/patients" },
          { label: "Register Patient" },
        ]}
      />
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Register New Patient</h1>
      <PatientForm redirectBase="/receptionist/patients" />
    </div>
  );
}