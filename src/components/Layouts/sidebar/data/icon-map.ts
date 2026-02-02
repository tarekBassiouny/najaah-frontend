import * as Icons from "../icons";

type SidebarIcon = typeof Icons[keyof typeof Icons];

const EXACT_ICON_MAP: Record<string, SidebarIcon> = {
  Dashboard: Icons.HomeIcon,
  Analytics: Icons.PieChart,
  Categories: Icons.FourCircle,
  Centers: Icons.Building,
  Courses: Icons.BookOpen,
  "Enrollment & Controls": Icons.ClipboardList,
  Videos: Icons.VideoPlay,
  Instructors: Icons.User,
  PDFs: Icons.FileText,
  Roles: Icons.KeyShield,
  Permissions: Icons.Authentication,
  Admins: Icons.UsersGroup,
  Students: Icons.UsersGroup,
  Settings: Icons.Gear,
  "Audit Logs": Icons.HistoryIcon,
};

type KeywordRule = {
  test: RegExp;
  icon: SidebarIcon;
};

const KEYWORD_RULES: KeywordRule[] = [
  { test: /dashboard/i, icon: Icons.HomeIcon },
  { test: /analytic|chart/i, icon: Icons.PieChart },
  { test: /center|branch/i, icon: Icons.Building },
  { test: /course|lesson/i, icon: Icons.BookOpen },
  { test: /category|tag/i, icon: Icons.FourCircle },
  { test: /video|media/i, icon: Icons.VideoPlay },
  { test: /pdf|file|doc/i, icon: Icons.FileText },
  { test: /role|permission|auth/i, icon: Icons.KeyShield },
  { test: /student|admin|user|instructor/i, icon: Icons.UsersGroup },
  { test: /setting|config/i, icon: Icons.Gear },
  { test: /audit|log|history/i, icon: Icons.HistoryIcon },
  { test: /enroll|request|device|control/i, icon: Icons.ClipboardList },
];

export function iconFromTitle(title: string): SidebarIcon {
  const exact = EXACT_ICON_MAP[title];
  if (exact) return exact;

  const rule = KEYWORD_RULES.find((item) => item.test.test(title));
  return rule?.icon ?? Icons.Table;
}
