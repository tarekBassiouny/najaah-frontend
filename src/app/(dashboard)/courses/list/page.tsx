import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Filters",
    description: "Status, modality, and center filters to be wired later.",
  },
  {
    title: "Course Grid",
    description:
      "Placeholder rows for code, title, owner, and enrollment stats.",
  },
  {
    title: "Quick Actions",
    description: "Archive, duplicate, publish, or assign reviewers.",
  },
];

export default function CoursesListPage() {
  return (
    <PlaceholderPage
      title="Course List"
      description="Browse and filter available courses."
      items={items}
    />
  );
}
