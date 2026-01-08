import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Defaults",
    "description": "Timezone, locale, and grading schemes."
  },
  {
    "title": "Escalations",
    "description": "Who gets notified for center incidents."
  },
  {
    "title": "Automation",
    "description": "Auto-provisioning and sync rules."
  }
];

export default function SettingsCenterSettingsPage() {
  return (
    <PlaceholderPage
      title="Center Settings"
      description="Defaults applied across centers."
      items={items}
    />
  );
}
