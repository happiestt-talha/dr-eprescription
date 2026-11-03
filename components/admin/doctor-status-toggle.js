"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { toggleDoctorActive } from "@/lib/actions/doctors";

export function DoctorStatusToggle({ doctorId, doctorName, isActive }) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(checked) {
    setActive(checked);
    setError("");
    startTransition(async () => {
      try {
        const res = await toggleDoctorActive(doctorId, checked);
        if (res?.error) throw new Error(res.error);
        router.refresh();
      } catch (err) {
        // Roll back the optimistic switch, as the other inline controls do.
        setActive(!checked);
        setError(err?.message && err.message !== "Failed to fetch" ? err.message : "Couldn't reach the server. Check your connection and try again.");
      }
    });
  }

  return (
    <div className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1">
      <Switch
        checked={active}
        disabled={isPending}
        onCheckedChange={handleChange}
        aria-label={`${active ? "Deactivate" : "Activate"} ${doctorName ? `Dr. ${doctorName}` : "doctor"}`}
      />
      {error && (
        <p role="alert" className="text-xs text-destructive max-w-40 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
