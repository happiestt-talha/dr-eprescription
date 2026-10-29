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
      const res = await toggleDoctorActive(doctorId, checked);
      if (res?.error) {
        setActive(!checked);
        setError(res.error);
        return;
      }
      router.refresh();
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
        <p role="alert" className="text-[11px] text-destructive max-w-40 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
