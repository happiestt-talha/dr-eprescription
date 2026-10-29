"use client";

import { CalendarClock, Users } from "lucide-react";
import { PortalSidebar } from "@/components/portal/portal-sidebar";

const links = [
  { href: "/receptionist/appointments", label: "Appointments", icon: CalendarClock },
  { href: "/receptionist/patients", label: "Patients", icon: Users },
];

export function ReceptionistSidebar() {
  return <PortalSidebar links={links} subtitle="Reception" breakpoint="md" />;
}
