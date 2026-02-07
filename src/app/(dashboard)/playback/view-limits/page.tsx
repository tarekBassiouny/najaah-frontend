import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Limits",
    description: "Placeholder for per-course and per-student rules.",
  },
  {
    title: "Usage",
    description: "Consumption vs. allowance overview.",
  },
  {
    title: "Overrides",
    description: "Temporary boosts and exemptions.",
  },
];

export default function PlaybackViewLimitsPage() {
  return (
    <PlaceholderPage
      title="View Limits"
      description="Configure and monitor view limits."
      items={items}
    />
  );
}
