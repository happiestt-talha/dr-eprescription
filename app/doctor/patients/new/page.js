import { PatientForm } from "@/components/patients/patient-form";

export default function NewPatientPage() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-4 sm:space-y-6 w-full min-w-0">
      <h1 className="text-xl sm:text-2xl font-semibold">Register New Patient</h1>
      <PatientForm redirectBase="/doctor/patients" />
    </div>
  );
}