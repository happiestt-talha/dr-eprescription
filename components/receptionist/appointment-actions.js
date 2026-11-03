"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAppointmentStatus, rescheduleAppointment } from "@/lib/actions/appointments";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/form-layout";
import { Form, FormStatus, SubmitButton } from "@/components/ui/form";
import { DateTimePicker } from "@/components/ui/date-picker";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const statuses = [
  { value: "pending", label: "Pending", color: "text-warning-strong" },
  { value: "confirmed", label: "Confirmed", color: "text-info-strong" },
  { value: "completed", label: "Completed", color: "text-success-strong" },
  { value: "cancelled", label: "Cancelled", color: "text-destructive-strong" },
];

/**
 * Status select + reschedule dialog for one appointment.
 * `appointment` is { id, status, doctorId, scheduledAtInput } (from
 * lib/lists.js appointmentRows); `doctorItems` is built once per page.
 */
export function AppointmentActions({ appointment, doctorItems }) {
  const router = useRouter();
  const [status, setStatus] = useState(appointment.status);
  const [open, setOpen] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(next) {
    const previous = status;
    setStatus(next);
    setStatusError("");
    startTransition(async () => {
      try {
        const res = await updateAppointmentStatus(appointment.id, next);
        if (res?.error) throw new Error(res.error);
        router.refresh();
      } catch (err) {
        setStatus(previous);
        setStatusError(err.message || "Couldn't update status");
      }
    });
  }

  // Errors live in the dialog's <Form>, so closing the dialog clears them.
  async function handleReschedule(formData) {
    const res = await rescheduleAppointment(appointment.id, formData);
    if (!res?.error) {
      setOpen(false);
      router.refresh();
    }
    return res;
  }

  const statusLabels = Object.fromEntries(statuses.map((s) => [s.value, s.label]));

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={handleStatusChange} disabled={isPending} items={statusLabels}>
        <SelectTrigger aria-label="Appointment status" className="w-32 sm:w-36 min-h-[38px] md:min-h-[34px] text-xs capitalize bg-card font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.value} value={s.value} className="capitalize text-xs font-medium">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          aria-label="Reschedule appointment"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "min-h-[36px] min-w-[36px] md:min-h-[34px] md:min-w-[34px] hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
        </DialogTrigger>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-xl">
          <Form onSubmit={handleReschedule} keepPendingOnSuccess={false} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Reschedule appointment</DialogTitle>
            </DialogHeader>

            <Field label="Doctor" htmlFor="doctorId" required>
              <Combobox
                id="doctorId"
                name="doctorId"
                items={doctorItems}
                defaultValue={appointment.doctorId}
                placeholder="Search doctor"
                emptyText="No doctors match"
                label="Doctor"
                required
              />
            </Field>

            <Field label="Date & time" htmlFor="scheduledAt" required>
              <DateTimePicker id="scheduledAt" name="scheduledAt" defaultValue={appointment.scheduledAtInput} required />
            </Field>

            <FormStatus variant="dialog" />

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 w-full px-5 sm:w-auto">
                Cancel
              </Button>
              <SubmitButton pendingText="Saving…" className="h-11 w-full px-6 sm:w-auto">
                Save changes
              </SubmitButton>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
      {statusError && <p role="alert" className="text-xs font-medium text-destructive">{statusError}</p>}
    </div>
  );
}