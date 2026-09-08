import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DoctorForm } from "@/components/admin/doctor-form";

export default async function EditDoctorPage({ params }) {
  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!doctor) notFound();

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Edit Doctor</h1>
      <DoctorForm
        mode="edit"
        doctorId={doctor.id}
        initialValues={doctor}
        email={doctor.user.email}
      />
    </div>
  );
}