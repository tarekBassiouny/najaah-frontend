import * as Icons from "../icons";
import type { Capability } from "@/lib/capabilities";
import { iconFromTitle } from "./icon-map";

type SidebarSubItem = {
  title: string;
  url: string;
  capability?: Capability;
};

type SidebarItem = {
  title: string;
  url?: string;
  icon?: (typeof Icons)[keyof typeof Icons];
  capability?: Capability;
  items: SidebarSubItem[];
};

type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

export const PLATFORM_SIDEBAR: SidebarSection[] = [
  {
    label: "ADMIN",
    items: [
      {
        title: "Dashboard",
        capability: "view_dashboard",
        icon: iconFromTitle("Dashboard"),
        url: "/dashboard",
        items: [],
      },
      {
        title: "Analysis",
        capability: "manage_analytics",
        icon: iconFromTitle("Analysis"),
        url: "/analytics",
        items: [],
      },
      {
        title: "Centers",
        capability: "manage_centers",
        icon: iconFromTitle("Centers"),
        url: "/centers",
        items: [],
      },
      {
        title: "Surveys",
        capability: "manage_surveys",
        icon: iconFromTitle("Surveys"),
        url: "/surveys",
        items: [],
      },
      {
        title: "Agents",
        capability: "view_agents",
        icon: iconFromTitle("Agents"),
        url: "/agents/executions",
        items: [],
      },
      {
        title: "Roles & Permissions",
        capability: "manage_roles",
        icon: iconFromTitle("Roles & Permissions"),
        url: "/roles",
        items: [],
      },
      {
        title: "Admins",
        capability: "manage_admin_users",
        icon: iconFromTitle("Admins"),
        url: "/admin-users",
        items: [],
      },
      {
        title: "Students",
        capability: "manage_students",
        icon: iconFromTitle("Students"),
        url: "/students",
        items: [],
      },
      {
        title: "Instructors",
        capability: "manage_instructors",
        icon: iconFromTitle("Instructors"),
        url: "/instructors",
        items: [],
      },
      {
        title: "Student Requests",
        capability: "manage_enrollments",
        icon: iconFromTitle("Student Requests"),
        url: "/student-requests",
        items: [],
      },
      {
        title: "Settings",
        capability: "view_settings",
        icon: iconFromTitle("Settings"),
        url: "/settings",
        items: [],
      },
      {
        title: "Audit Log",
        capability: "view_audit_logs",
        icon: iconFromTitle("Audit Log"),
        url: "/audit-logs",
        items: [],
      },
    ],
  },
];
