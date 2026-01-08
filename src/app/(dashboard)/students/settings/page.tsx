import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Notifications",
    "description": "Email, SMS, and push toggles."
  },
  {
    "title": "Access",
    "description": "Login restrictions and MFA placeholders."
  },
  {
    "title": "Privacy",
    "description": "Data export and retention policies."
  }
];

export default function StudentsSettingsPage() {
  return (
    <PlaceholderPage
      title="Student Settings"
      description="Per-student preferences and access rules."
      items={items}
    />
  );
}
