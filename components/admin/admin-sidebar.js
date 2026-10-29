"use client";

import { LayoutDashboard, Stethoscope, Pill, FlaskConical, FileBarChart, ScrollText } from "lucide-react";
import { PortalSidebar } from "@/components/portal/portal-sidebar";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/medicines", label: "Medicines", icon: Pill },
  { href: "/admin/lab-tests", label: "Lab Tests", icon: FlaskConical },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
];

export function AdminSidebar() {
  return <PortalSidebar links={links} subtitle="Admin" breakpoint="lg" />;
}
