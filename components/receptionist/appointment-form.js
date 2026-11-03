"use client";

import { useRouter } from "next/navigation";
import { createAppointment } from "@/lib/actions/appointments";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DateTimePicker } from "@/components/ui/date-picker";
import { Field, FormActions, FormSection } from "@/components/ui/form-layout";
import { Form, FormStatus, SubmitButton } from "@/components/ui/form";
import { CLINIC_CLOSE, CLINIC_OPEN, formatTimeOfDay } from "@/lib/datetime";

export function AppointmentForm({ patientId, doctorItems }) {
  const router = useRouter();
  async function handleSubmit(formData) {
    formData.set("patientId", patientId);
    const res = await createAppointment(formData);
    // Stays pending while navigating, so the booking can't be made twice.
    if (!res?.error) router.push("/receptionist/appointments");
    return res;
  }


  return (
    <Form onSubmit={handleSubmit}>
      <FormSection
        title="Appointment details"
        description={`Clinic hours are ${formatTimeOfDay(CLINIC_OPEN)} – ${formatTimeOfDay(CLINIC_CLOSE)}, in 15-minute slots.`}
        columns="pair">
        <Field label="Attending doctor" htmlFor="doctorId" required>
          <Combobox
            id="doctorId"
            name="doctorId"
            items={doctorItems}
            placeholder="Search by name or specialisation"
            emptyText="No doctors match"
            label="Doctor"
            required
          />
        </Field>
        <Field label="Date & time" htmlFor="scheduledAt" required>
          <DateTimePicker id="scheduledAt" name="scheduledAt" required />
        </Field>
      </FormSection>

      <FormStatus />

      <FormActions>
        <Button type="button" variant="outline" className="h-11 px-5" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton pendingText="Booking…" className="h-11 px-6">
          Book appointment
        </SubmitButton>
      </FormActions>
    </Form>
  );
}
