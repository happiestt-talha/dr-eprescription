"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function PatientSearchBar({ defaultValue = "" }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e) {
    e.preventDefault();
    const params = value.trim() ? `?q=${encodeURIComponent(value.trim())}` : "";
    router.push(`/doctor/patients${params}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name, phone, CNIC, or ID..."
      />
      <Button type="submit" variant="secondary">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}