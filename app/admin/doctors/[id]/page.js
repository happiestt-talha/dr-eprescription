import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DoctorForm } from "@/components/admin/doctor-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
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
    <div className="p-4 sm:p-6 max-w-2xl space-y-4 sm:space-y-6">
      <Breadcrumbs
        segments={[
          { label: "Doctors", href: "/admin/doctors" },
          { label: `Dr. ${doctor.fullName}` },
        ]}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Edit Doctor</h1>
        <ResetPasswordButton kind="doctor" targetId={doctor.id} name={`Dr. ${doctor.fullName}`} className="w-full sm:w-auto" />
      </div>
      <DoctorForm
        mode="edit"
        doctorId={doctor.id}
        initialValues={{ ...doctor, user: undefined }}
        email={doctor.user.email}
      />
    </div>
  );
}