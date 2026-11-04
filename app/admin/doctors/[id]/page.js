import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DoctorForm } from "@/components/admin/doctor-form";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FormPage } from "@/components/ui/form-layout";
import { ResetPasswordButton } from "@/components/account/reset-password-button";

export default async function EditDoctorPage({ params }) {
  const { id } = await params;

  // Select explicitly: this object is passed to a client component, so it must
  // never include the user row (passwordHash).
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      qualification: true,
      specialization: true,
      registrationNo: true,
      phone: true,
      clinicName: true,
      clinicAddress: true,
      user: { select: { email: true } },
    },
  });

  if (!doctor) notFound();

  return (
    <FormPage
      top={<Breadcrumbs segments={[{ label: "Doctors", href: "/admin/doctors" }, { label: `Dr. ${doctor.fullName}` }]} />}>
      <PageHeader
        title="Edit doctor"
        description={`Dr. ${doctor.fullName}`}
        actions={<ResetPasswordButton kind="doctor" targetId={doctor.id} name={`Dr. ${doctor.fullName}`} />}
      />
      <DoctorForm
        mode="edit"
        doctorId={doctor.id}
        initialValues={{ ...doctor, user: undefined }}
        email={doctor.user.email}
      />
    </FormPage>
  );
}
