import { DoctorForm } from "@/components/admin/doctor-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FormPage } from "@/components/ui/form-layout";

export default function NewDoctorPage() {
  return (
    <FormPage
      title="Add doctor"
      description="Creates the doctor's profile and their sign-in account."
      top={<Breadcrumbs segments={[{ label: "Doctors", href: "/admin/doctors" }, { label: "Add doctor" }]} />}>
      <DoctorForm />
    </FormPage>
  );
}
