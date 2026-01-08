import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Templates",
    "description": "Default syllabus and grading templates."
  },
  {
    "title": "Publishing",
    "description": "Review flows and scheduling windows."
  },
  {
    "title": "Access",
    "description": "Enrollment caps and prerequisites."
  }
];

export default function SettingsCourseSettingsPage() {
  return (
    <PlaceholderPage
      title="Course Settings"
      description="Global course delivery rules."
      items={items}
    />
  );
}
