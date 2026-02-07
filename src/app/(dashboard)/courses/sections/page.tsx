import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Roster",
    description: "Placeholder for section name, instructor, and capacity.",
  },
  {
    title: "Schedule",
    description: "Meeting patterns and time zones.",
  },
  {
    title: "Status",
    description: "Enrollment windows and section health.",
  },
];

export default function CoursesSectionsPage() {
  return (
    <PlaceholderPage
      title="Sections"
      description="Organize course sections and their schedules."
      items={items}
    />
  );
}
