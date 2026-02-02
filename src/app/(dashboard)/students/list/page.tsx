import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Filters",
    description: "Center, enrollment, device status, and risk filters.",
  },
  {
    title: "Data Table",
    description: "Placeholder columns for name, email, center, and status.",
  },
  {
    title: "Actions",
    description: "Suspend, reset, or export actions to wire later.",
  },
];

export default function StudentsListPage() {
  return (
    <PlaceholderPage
      title="Student List"
      description="Search and filter all students."
      items={items}
    />
  );
}
