"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function PatientSearchBar({ defaultValue = "", basePath = "/doctor/patients" }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e) {
    e.preventDefault();
    const params = value.trim() ? `?q=${encodeURIComponent(value.trim())}` : "";
    router.push(`${basePath}${params}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name, phone, CNIC, or ID..."
        className="min-h-[44px] md:min-h-[36px] w-full"
      />
      <Button type="submit" variant="secondary" className="min-h-[44px] md:min-h-[36px] w-full sm:w-auto px-4 flex items-center justify-center gap-2 shrink-0">
        <Search className="h-4 w-4" />
        <span className="sm:hidden text-xs">Search</span>
      </Button>
    </form>
  );
}