import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Branding",
    description: "Logos, theme presets, and primary contacts.",
  },
  {
    title: "Security",
    description: "MFA, session limits, and audit retention.",
  },
  {
    title: "Notifications",
    description: "Email/webhook destinations and templates.",
  },
];

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Global LMS configuration."
      items={items}
    />
  );
}
