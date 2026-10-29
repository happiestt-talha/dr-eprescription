"use client";

import { LayoutDashboard, Users, FileEdit } from "lucide-react";
import { PortalSidebar } from "@/components/portal/portal-sidebar";

const links = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/patients", label: "Patients", icon: Users },
  { href: "/doctor/drafts", label: "Drafts", icon: FileEdit },
];

export function DoctorSidebar() {
  return <PortalSidebar links={links} subtitle="Doctor" breakpoint="md" />;
}
