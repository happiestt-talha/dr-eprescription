import { PatientForm } from "@/components/patients/patient-form";

export default function NewPatientPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Register New Patient</h1>
      <PatientForm redirectBase="/doctor/patients" />
    </div>
  );
}