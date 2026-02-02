import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Events",
    description: "Admin actions, config updates, and releases.",
  },
  {
    title: "Retention",
    description: "Export, purge, and retention controls.",
  },
  {
    title: "Notifications",
    description: "Who is alerted for critical changes.",
  },
];

export default function AuditSystemLogsPage() {
  return (
    <PlaceholderPage
      title="System Logs"
      description="Platform and configuration changes."
      items={items}
    />
  );
}
