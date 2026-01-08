import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Queue",
    "description": "Placeholder rows for queued and completed uploads."
  },
  {
    "title": "Validation",
    "description": "Error handling and retry strategies."
  },
  {
    "title": "Ownership",
    "description": "Track who initiated each batch."
  }
];

export default function CoursesUploadSessionsPage() {
  return (
    <PlaceholderPage
      title="Upload Sessions"
      description="Queue and monitor bulk session uploads."
      items={items}
    />
  );
}
