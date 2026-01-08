import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "LMS",
    items: [
      {
        title: "Dashboard",
        capability: "view_dashboard",
        icon: Icons.HomeIcon,
        items: [
          {
            title: "Overview",
            url: "/dashboard",
            capability: "view_dashboard",
          },
        ],
      },
      {
        title: "Centers",
        capability: "manage_centers",
        icon: Icons.Table,
        items: [
          {
            title: "List",
            url: "/centers/list",
            capability: "manage_centers",
          },
          {
            title: "Create",
            url: "/centers/create",
            capability: "manage_centers",
          },
          {
            title: "Settings",
            url: "/centers/settings",
            capability: "manage_centers",
          },
        ],
      },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      {
        title: "Courses",
        capability: "manage_courses",
        icon: Icons.Alphabet,
        items: [
          {
            title: "List",
            url: "/courses/list",
            capability: "manage_courses",
          },
          {
            title: "Create",
            url: "/courses/create",
            capability: "manage_courses",
          },
          {
            title: "Upload Sessions",
            url: "/courses/upload-sessions",
            capability: "manage_courses",
          },
          {
            title: "Sections",
            url: "/courses/sections",
            capability: "manage_courses",
          },
        ],
      },
      {
        title: "Videos",
        capability: "manage_videos",
        icon: Icons.FourCircle,
        items: [
          {
            title: "Library",
            url: "/videos/library",
            capability: "manage_videos",
          },
          {
            title: "Upload Queue",
            url: "/videos/upload-queue",
            capability: "manage_videos",
          },
          {
            title: "Processing Status",
            url: "/videos/processing-status",
            capability: "manage_videos",
          },
        ],
      },
      {
        title: "PDFs",
        capability: "manage_pdfs",
        icon: Icons.Table,
        items: [
          {
            title: "Library",
            url: "/pdfs/library",
            capability: "manage_pdfs",
          },
        ],
      },
      {
        title: "Students",
        capability: "manage_students",
        icon: Icons.User,
        items: [
          {
            title: "List",
            url: "/students/list",
            capability: "manage_students",
          },
          {
            title: "Devices",
            url: "/students/devices",
            capability: "manage_students",
          },
          {
            title: "Enrollments",
            url: "/students/enrollments",
            capability: "manage_students",
          },
          {
            title: "Settings",
            url: "/students/settings",
            capability: "manage_students",
          },
        ],
      },
      {
        title: "Enrollments",
        url: "/enrollments",
        capability: "view_dashboard",
        icon: Icons.Alphabet,
        items: [],
      },
      {
        title: "Device Change Requests",
        url: "/device-change-requests",
        capability: "manage_device_change_requests",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "Extra View Requests",
        url: "/extra-view-requests",
        capability: "manage_extra_view_requests",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "Instructors",
        url: "/instructors",
        capability: "manage_instructors",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Admin Users",
        url: "/admin-users",
        capability: "manage_admin_users",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Roles",
        url: "/roles",
        capability: "manage_roles",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Permissions",
        url: "/permissions",
        capability: "view_permissions",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Playback",
        capability: "view_dashboard",
        icon: Icons.PieChart,
        items: [
          {
            title: "View Limits",
            url: "/playback/view-limits",
            capability: "view_dashboard",
          },
          {
            title: "Playback Sessions",
            url: "/playback/playback-sessions",
            capability: "view_dashboard",
          },
          {
            title: "Violations",
            url: "/playback/violations",
            capability: "view_dashboard",
          },
        ],
      },
      {
        title: "Settings",
        capability: "view_dashboard",
        icon: Icons.Calendar,
        items: [
          {
            title: "Center Settings",
            url: "/settings/center-settings",
            capability: "view_dashboard",
          },
          {
            title: "Course Settings",
            url: "/settings/course-settings",
            capability: "view_dashboard",
          },
          {
            title: "Video Settings",
            url: "/settings/video-settings",
            capability: "view_dashboard",
          },
          {
            title: "Student Settings",
            url: "/settings/student-settings",
            capability: "view_dashboard",
          },
        ],
      },
      {
        title: "Audit Logs",
        url: "/audit-logs",
        capability: "view_audit_logs",
        icon: Icons.Authentication,
        items: [],
      },
    ],
  },
];
