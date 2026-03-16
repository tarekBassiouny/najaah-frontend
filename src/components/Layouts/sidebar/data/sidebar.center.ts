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
  badge?: string;
  badgeKey?: string;
  items: SidebarSubItem[];
};

type SidebarSection = {
  label: string;
  labelKey: string;
  items: SidebarItem[];
};

export const CENTER_SIDEBAR: SidebarSection[] = [
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
        title: "Analytics",
        titleKey: "sidebar.items.analytics",
        capability: "manage_analytics",
        icon: iconFromTitle("Analytics"),
        url: "/analytics",
        items: [],
      },
      {
        title: "Categories",
        titleKey: "sidebar.items.categories",
        capability: "manage_courses",
        icon: iconFromTitle("Categories"),
        url: "/categories",
        items: [],
      },
      {
        title: "Courses",
        titleKey: "sidebar.items.courses",
        capability: "manage_courses",
        icon: iconFromTitle("Courses"),
        url: "/courses",
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
        title: "Student Requests",
        titleKey: "sidebar.items.studentRequests",
        capability: "manage_enrollments",
        icon: iconFromTitle("Student Requests"),
        url: "/student-requests",
        items: [],
      },
      {
        title: "Videos",
        titleKey: "sidebar.items.videos",
        capability: "manage_videos",
        icon: iconFromTitle("Videos"),
        url: "/videos",
        items: [],
      },
      {
        title: "Video Code Batches",
        titleKey: "sidebar.items.videoCodeBatches",
        capability: "manage_video_access",
        icon: iconFromTitle("Videos"),
        url: "/video-code-batches",
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
        title: "PDFs",
        titleKey: "sidebar.items.pdfs",
        capability: "manage_pdfs",
        icon: iconFromTitle("PDFs"),
        url: "/pdfs",
        items: [],
      },
      {
        title: "Roles",
        titleKey: "sidebar.items.roles",
        capability: "manage_roles",
        icon: iconFromTitle("Roles"),
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
        title: "Landing Page",
        titleKey: "sidebar.items.landingPage",
        capability: "manage_landing_pages",
        icon: iconFromTitle("Landing Page"),
        url: "/landing-page",
        badge: "Beta",
        badgeKey: "badges.beta",
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
        title: "Audit Logs",
        titleKey: "sidebar.items.auditLogs",
        capability: "view_audit_logs",
        icon: iconFromTitle("Audit Logs"),
        url: "/audit-logs",
        items: [],
      },
    ],
  },
];
