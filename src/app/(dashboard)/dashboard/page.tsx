import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Throughput",
    "description": "Placeholder for enrollment, course, and device metrics."
  },
  {
    "title": "Queues",
    "description": "Track pending approvals, uploads, and processing items."
  },
  {
    "title": "Recent Activity",
    "description": "System-wide events and audit highlights will land here."
  }
];

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      description="High-level LMS operations overview with placeholders for KPIs and activity."
      items={items}
    />
  );
}
