"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/lib/actions/appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlus } from "lucide-react";

export function AppointmentForm({ patientId, doctors, minDateTime }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    formData.set("patientId", patientId);

    try {
      const res = await createAppointment(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      // Keep the button disabled while navigating, so the booking can't be made twice.
      router.push("/receptionist/appointments");
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setLoading(false);
    }
  }

  const doctorItems = doctors.map((d) => ({ value: d.id, label: `Dr. ${d.fullName}`, detail: d.specialization || "" }));

  return (
    <Card className="border-border/60 shadow-xs">
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="doctorId" className="text-xs font-semibold">Attending Doctor *</Label>
            <Combobox
              id="doctorId"
              name="doctorId"
              items={doctorItems}
              placeholder="Search doctor by name or specialty"
              emptyText="No doctors match"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scheduledAt" className="text-xs font-semibold">Appointment Date & Time *</Label>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              min={minDateTime}
              required
              className="min-h-[44px] md:min-h-[38px] w-full"
            />
          </div>

          {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[44px] shadow-xs">
            {loading ? "Booking..." : "Confirm & Book Appointment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}