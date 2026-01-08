import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Session Table",
    "description": "Course, student, device, and duration columns."
  },
  {
    "title": "Geo & Network",
    "description": "IP, region, and network quality placeholders."
  },
  {
    "title": "Interventions",
    "description": "Pause, revoke, or flag actions."
  }
];

export default function PlaybackPlaybackSessionsPage() {
  return (
    <PlaceholderPage
      title="Playback Sessions"
      description="Inspect active and historical sessions."
      items={items}
    />
  );
}
