import * as Icons from "../icons";
import type { Capability } from "@/lib/capabilities";
import { iconFromTitle } from "./icon-map";

type SidebarSubItem = {
  title: string;
  titleKey: string;
  url: string;
  capability?: Capability;
};

type SidebarItem = {
  title: string;
  titleKey: string;
  url?: string;
  icon?: (typeof Icons)[keyof typeof Icons];
  capability?: Capability;
  items: SidebarSubItem[];
};

type SidebarSection = {
  label: string;
  labelKey: string;
  items: SidebarItem[];
};

export const PLATFORM_SIDEBAR: SidebarSection[] = [
  {
    label: "ADMIN",
    labelKey: "sidebar.sections.admin",
    items: [
      {
        title: "Dashboard",
        titleKey: "sidebar.items.dashboard",
        capability: "view_dashboard",
        icon: iconFromTitle("Dashboard"),
        url: "/dashboard",
        items: [],
      },
      {
        title: "Analysis",
        titleKey: "sidebar.items.analysis",
        capability: "manage_analytics",
        icon: iconFromTitle("Analysis"),
        url: "/analytics",
        items: [],
      },
      {
        title: "Centers",
        titleKey: "sidebar.items.centers",
        capability: "manage_centers",
        icon: iconFromTitle("Centers"),
        url: "/centers",
        items: [],
      },
      {
        title: "Surveys",
        titleKey: "sidebar.items.surveys",
        capability: "manage_surveys",
        icon: iconFromTitle("Surveys"),
        url: "/surveys",
        items: [],
      },
      {
        title: "Agents",
        titleKey: "sidebar.items.agents",
        capability: "view_agents",
        icon: iconFromTitle("Agents"),
        url: "/agents/executions",
        items: [],
      },
      {
        title: "Roles & Permissions",
        titleKey: "sidebar.items.rolesAndPermissions",
        capability: "manage_roles",
        icon: iconFromTitle("Roles & Permissions"),
        url: "/roles",
        items: [],
      },
      {
        title: "Admins",
        titleKey: "sidebar.items.admins",
        capability: "manage_admin_users",
        icon: iconFromTitle("Admins"),
        url: "/admin-users",
        items: [],
      },
      {
        title: "Students",
        titleKey: "sidebar.items.students",
        capability: "manage_students",
        icon: iconFromTitle("Students"),
        url: "/students",
        items: [],
      },
      {
        title: "Education",
        titleKey: "sidebar.items.education",
        capability: "manage_students",
        icon: iconFromTitle("Education"),
        url: "/education",
        items: [],
      },
      {
        title: "Instructors",
        titleKey: "sidebar.items.instructors",
        capability: "manage_instructors",
        icon: iconFromTitle("Instructors"),
        url: "/instructors",
        items: [],
      },
      {
        title: "Student Requests",
        titleKey: "sidebar.items.studentRequests",
        capability: "manage_enrollments",
        icon: iconFromTitle("Student Requests"),
        url: "/student-requests",
        items: [],
      },
      {
        title: "Settings",
        titleKey: "sidebar.items.settings",
        capability: "view_settings",
        icon: iconFromTitle("Settings"),
        url: "/settings",
        items: [],
      },
      {
        title: "Audit Log",
        titleKey: "sidebar.items.auditLog",
        capability: "view_audit_logs",
        icon: iconFromTitle("Audit Log"),
        url: "/audit-logs",
        items: [],
      },
    ],
  },
];
