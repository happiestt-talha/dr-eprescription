"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAppointmentStatus, rescheduleAppointment } from "@/lib/actions/appointments";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";

const statuses = ["pending", "confirmed", "completed", "cancelled"];

function toLocalDatetimeInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AppointmentActions({ appointment, doctors }) {
  const router = useRouter();
  const [status, setStatus] = useState(appointment.status);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(next) {
    setStatus(next);
    startTransition(async () => {
      await updateAppointmentStatus(appointment.id, next);
      router.refresh();
    });
  }

  async function handleReschedule(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.target);

    startTransition(async () => {
      const res = await rescheduleAppointment(appointment.id, formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={handleStatusChange} disabled={isPending}>
        <SelectTrigger className="w-32 sm:w-36 min-h-[40px] md:min-h-[36px] text-xs sm:text-sm capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="min-h-[40px] min-w-[40px] md:min-h-[36px] md:min-w-[36px]">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
          <form onSubmit={handleReschedule} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Reschedule Appointment</DialogTitle>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="doctorId">Doctor</Label>
              <Select name="doctorId" defaultValue={appointment.doctorId}>
                <SelectTrigger id="doctorId" className="w-full min-h-[44px] md:min-h-[36px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>Dr. {d.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scheduledAt">Date & Time</Label>
              <Input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                defaultValue={toLocalDatetimeInputValue(appointment.scheduledAt)}
                className="w-full min-h-[44px] md:min-h-[36px]"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto min-h-[44px] md:min-h-[36px]">
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}