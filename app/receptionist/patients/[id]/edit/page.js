import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PatientForm } from "@/components/patients/patient-form";
import { serialize } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FormPage } from "@/components/ui/form-layout";

export default async function EditPatientPage({ params }) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) notFound();

  return (
    <FormPage
      title="Edit patient"
      description={`${patient.fullName} · ${patient.patientCode}`}
      top={
        <Breadcrumbs
          segments={[
            { label: "Patients", href: "/receptionist/patients" },
            { label: patient.fullName, href: `/receptionist/patients/${patient.id}` },
            { label: "Edit" },
          ]}
        />
      }>
      <PatientForm mode="edit" patientId={patient.id} initialValues={serialize(patient)} redirectBase="/receptionist/patients" />
    </FormPage>
  );
}
