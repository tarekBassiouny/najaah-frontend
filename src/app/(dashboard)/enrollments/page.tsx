import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Pipelines",
    "description": "New, in-progress, completed, and failed enrollments."
  },
  {
    "title": "Sources",
    "description": "Self-serve, bulk, and admin-enrolled splits."
  },
  {
    "title": "Quality",
    "description": "Validation errors and retry guidance."
  }
];

export default function EnrollmentsPage() {
  return (
    <PlaceholderPage
      title="Enrollments"
      description="Enrollment pipelines and status tracking."
      items={items}
    />
  );
}
