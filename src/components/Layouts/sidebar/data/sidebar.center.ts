import * as Icons from "../icons";
import type { Capability } from "@/lib/capabilities";

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

export const CENTER_SIDEBAR: SidebarSection[] = [
  {
    label: "ADMIN",
    items: [
      {
        title: "Dashboard",
        capability: "view_dashboard",
        icon: Icons.HomeIcon,
        url: "/dashboard",
        items: [],
      },
      {
        title: "Analytics",
        capability: "view_dashboard",
        icon: Icons.PieChart,
        url: "/analytics",
        items: [],
      },
      {
        title: "Categories",
        capability: "manage_courses",
        icon: Icons.Alphabet,
        url: "/categories",
        items: [],
      },
      {
        title: "Courses",
        capability: "manage_courses",
        icon: Icons.Alphabet,
        url: "/courses",
        items: [],
      },
      {
        title: "Enrollment & Controls",
        capability: "manage_students",
        icon: Icons.Alphabet,
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
        icon: Icons.FourCircle,
        url: "/videos",
        items: [],
      },
      {
        title: "Instructors",
        capability: "manage_instructors",
        icon: Icons.User,
        url: "/instructors",
        items: [],
      },
      {
        title: "PDFs",
        capability: "manage_pdfs",
        icon: Icons.Table,
        url: "/pdfs",
        items: [],
      },
      {
        title: "Roles",
        capability: "manage_roles",
        icon: Icons.User,
        url: "/roles",
        items: [],
      },
      {
        title: "Permissions",
        capability: "view_permissions",
        icon: Icons.Authentication,
        url: "/permissions",
        items: [],
      },
      {
        title: "Admins",
        capability: "manage_admin_users",
        icon: Icons.User,
        url: "/admin-users",
        items: [],
      },
      {
        title: "Students",
        capability: "manage_students",
        icon: Icons.User,
        url: "/students",
        items: [],
      },
      {
        title: "Settings",
        capability: "view_dashboard",
        icon: Icons.Authentication,
        url: "/settings",
        items: [],
      },
      {
        title: "Audit Logs",
        capability: "view_audit_logs",
        icon: Icons.Authentication,
        url: "/audit-logs",
        items: [],
      },
    ],
  },
];
