import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "System",
    description: "Config changes, deployments, and admin actions.",
  },
  {
    title: "Playback",
    description: "Playback-specific logs and violations.",
  },
  {
    title: "Devices",
    description: "Device approvals, bindings, and revocations.",
  },
];

export default function AuditPage() {
  return (
    <PlaceholderPage
      title="Audit Logs"
      description="System-wide audit trails."
      items={items}
    />
  );
}
