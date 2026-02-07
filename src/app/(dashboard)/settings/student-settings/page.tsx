import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Authentication",
    description: "MFA policies and login restrictions.",
  },
  {
    title: "Privacy",
    description: "Data retention and export settings.",
  },
  {
    title: "Engagement",
    description: "Reminder cadence and communication rules.",
  },
];

export default function SettingsStudentSettingsPage() {
  return (
    <PlaceholderPage
      title="Student Settings"
      description="Defaults for student access and privacy."
      items={items}
    />
  );
}
