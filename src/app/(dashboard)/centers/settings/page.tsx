import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Branding",
    "description": "Logos, colors, and contact info placeholders."
  },
  {
    "title": "Policies",
    "description": "Attendance, device limits, and approval rules."
  },
  {
    "title": "Notifications",
    "description": "Email and webhook destinations per center."
  }
];

export default function CentersSettingsPage() {
  return (
    <PlaceholderPage
      title="Center Settings"
      description="Per-center defaults and operational preferences."
      items={items}
    />
  );
}
