import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Metadata",
    "description": "Title, description, tags, and center alignment."
  },
  {
    "title": "Publishing",
    "description": "Visibility, release window, and enrollment caps."
  },
  {
    "title": "Collaboration",
    "description": "Assign instructors and content reviewers."
  }
];

export default function CoursesCreatePage() {
  return (
    <PlaceholderPage
      title="Create Course"
      description="Draft a new course with metadata and ownership."
      items={items}
    />
  );
}
