import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Alerts",
    "description": "Concurrent sessions, VPN, and device mismatch signals."
  },
  {
    "title": "Resolution",
    "description": "Workflows for reviewing and clearing incidents."
  },
  {
    "title": "Trends",
    "description": "Patterns by center, course, or device type."
  }
];

export default function PlaybackViolationsPage() {
  return (
    <PlaceholderPage
      title="Playback Violations"
      description="Review suspicious playback behavior."
      items={items}
    />
  );
}
