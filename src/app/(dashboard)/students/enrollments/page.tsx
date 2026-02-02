import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Roster",
    description: "Course, progress, completion, and grade placeholders.",
  },
  {
    title: "Attendance",
    description: "Check-ins and participation signals.",
  },
  {
    title: "Interventions",
    description: "Flags for follow-up and support cases.",
  },
];

export default function StudentsEnrollmentsPage() {
  return (
    <PlaceholderPage
      title="Student Enrollments"
      description="Enrollments scoped by student."
      items={items}
    />
  );
}
