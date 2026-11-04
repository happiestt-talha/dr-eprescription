import { PatientForm } from "@/components/patients/patient-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FormPage } from "@/components/ui/form-layout";

export default function NewPatientPage() {
  return (
    <FormPage
      title="Register new patient"
      description="Fields marked * are required. Everything else can be added later."
      top={<Breadcrumbs segments={[{ label: "Patients", href: "/doctor/patients" }, { label: "Register patient" }]} />}>
      <PatientForm redirectBase="/doctor/patients" />
    </FormPage>
  );
}
