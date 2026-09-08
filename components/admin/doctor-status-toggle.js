"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleDoctorActive } from "@/lib/actions/doctors";

export function DoctorStatusToggle({ doctorId, userId, isActive }) {
  const [active, setActive] = useState(isActive);
  const [isPending, startTransition] = useTransition();

  function handleChange(checked) {
    setActive(checked);
    startTransition(async () => {
      const res = await toggleDoctorActive(doctorId, userId, checked);
      if (res?.error) setActive(!checked);
    });
  }

  return <Switch checked={active} disabled={isPending} onCheckedChange={handleChange} />;
}