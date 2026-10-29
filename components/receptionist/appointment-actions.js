"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAppointmentStatus, rescheduleAppointment } from "@/lib/actions/appointments";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Pencil, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toClinicInputValue } from "@/lib/datetime";

const statuses = [
  { value: "pending", label: "Pending", color: "text-amber-600" },
  { value: "confirmed", label: "Confirmed", color: "text-blue-600" },
  { value: "completed", label: "Completed", color: "text-emerald-600" },
  { value: "cancelled", label: "Cancelled", color: "text-rose-600" },
];

export function AppointmentActions({ appointment, doctors }) {
  const router = useRouter();
  const [status, setStatus] = useState(appointment.status);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
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

  async function handleReschedule(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.target);

    startTransition(async () => {
      try {
        const res = await rescheduleAppointment(appointment.id, formData);
        if (res?.error) {
          setError(res.error);
          return;
        }
        setOpen(false);
        router.refresh();
      } catch {
        setError("Couldn't reach the server. Please try again.");
      }
    });
  }

  const statusLabels = Object.fromEntries(statuses.map((s) => [s.value, s.label]));
  const doctorItems = doctors.map((d) => ({ value: d.id, label: `Dr. ${d.fullName}`, detail: d.specialization || "" }));

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
          <form onSubmit={handleReschedule} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Reschedule Appointment</DialogTitle>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="doctorId" className="text-xs font-semibold">Doctor</Label>
              <Combobox
                id="doctorId"
                name="doctorId"
                items={doctorItems}
                defaultValue={appointment.doctorId}
                placeholder="Search doctor"
                emptyText="No doctors match"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scheduledAt" className="text-xs font-semibold">Date & Time</Label>
              <Input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                defaultValue={toClinicInputValue(appointment.scheduledAt)}
                className="w-full min-h-[44px] md:min-h-[38px]"
              />
            </div>

            {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto min-h-[44px]">
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {statusError && <p className="text-xs font-medium text-destructive">{statusError}</p>}
    </div>
  );
}