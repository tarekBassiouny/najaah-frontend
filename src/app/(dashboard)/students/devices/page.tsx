import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Device List",
    "description": "Device type, last seen, and compliance status placeholders."
  },
  {
    "title": "Limits",
    "description": "Per-student device caps and exemptions."
  },
  {
    "title": "Security",
    "description": "Trusted vs. risky devices summary."
  }
];

export default function StudentsDevicesPage() {
  return (
    <PlaceholderPage
      title="Student Devices"
      description="Devices registered per student."
      items={items}
    />
  );
}
