import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DoctorForm } from "@/components/admin/doctor-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function EditDoctorPage({ params }) {
  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { user: true },
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
      <h1 className="text-xl sm:text-2xl font-semibold">Edit Doctor</h1>
      <DoctorForm
        mode="edit"
        doctorId={doctor.id}
        initialValues={doctor}
        email={doctor.user.email}
      />
    </div>
  );
}