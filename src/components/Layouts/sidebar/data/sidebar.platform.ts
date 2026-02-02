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
  icon?: typeof Icons[keyof typeof Icons];
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
        title: "Analytics",
        capability: "view_dashboard",
        icon: iconFromTitle("Analytics"),
        url: "/analytics",
        items: [],
      },
      {
        title: "Categories",
        capability: "manage_courses",
        icon: iconFromTitle("Categories"),
        url: "/categories",
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
        title: "Courses",
        capability: "manage_courses",
        icon: iconFromTitle("Courses"),
        url: "/courses",
        items: [],
      },
      {
        title: "Enrollment & Controls",
        capability: "manage_students",
        icon: iconFromTitle("Enrollment & Controls"),
        items: [
          {
            title: "Enrollments",
            url: "/enrollments",
            capability: "manage_students",
          },
          {
            title: "Extra View Requests",
            url: "/extra-view-requests",
            capability: "manage_extra_view_requests",
          },
          {
            title: "Device Change Requests",
            url: "/device-change-requests",
            capability: "manage_device_change_requests",
          },
        ],
      },
      {
        title: "Videos",
        capability: "manage_videos",
        icon: iconFromTitle("Videos"),
        url: "/videos",
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
        title: "PDFs",
        capability: "manage_pdfs",
        icon: iconFromTitle("PDFs"),
        url: "/pdfs",
        items: [],
      },
      {
        title: "Roles",
        capability: "manage_roles",
        icon: iconFromTitle("Roles"),
        url: "/roles",
        items: [],
      },
      {
        title: "Permissions",
        capability: "view_permissions",
        icon: iconFromTitle("Permissions"),
        url: "/permissions",
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
        title: "Settings",
        capability: "view_dashboard",
        icon: iconFromTitle("Settings"),
        url: "/settings",
        items: [],
      },
      {
        title: "Audit Logs",
        capability: "view_audit_logs",
        icon: iconFromTitle("Audit Logs"),
        url: "/audit-logs",
        items: [],
      },
    ],
  },
];
