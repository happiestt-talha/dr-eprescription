import { PatientForm } from "@/components/patients/patient-form";

export default function NewPatientPage() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl w-full min-w-0">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Register New Patient</h1>
      <PatientForm redirectBase="/receptionist/patients" />
    </div>
  );
}