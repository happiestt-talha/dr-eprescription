"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/lib/actions/appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlus } from "lucide-react";

export function AppointmentForm({ patientId, doctors }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    formData.set("patientId", patientId);

    const res = await createAppointment(formData);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    router.push("/receptionist/appointments");
  }

  return (
    <Card className="border-border/60 shadow-xs">
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="doctorId" className="text-xs font-semibold">Attending Doctor *</Label>
            <Select name="doctorId" required>
              <SelectTrigger id="doctorId" className="w-full min-h-[44px] md:min-h-[38px]">
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    Dr. {d.fullName} ({d.specialization})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scheduledAt" className="text-xs font-semibold">Appointment Date & Time *</Label>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              required
              className="min-h-[44px] md:min-h-[38px] w-full"
            />
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[44px] shadow-xs">
            {loading ? "Booking..." : "Confirm & Book Appointment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}