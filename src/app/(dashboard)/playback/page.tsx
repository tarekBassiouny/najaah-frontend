import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Sessions",
    "description": "Active and historical playback counts."
  },
  {
    "title": "Policies",
    "description": "View limits, geo rules, and DRM controls."
  },
  {
    "title": "Alerts",
    "description": "Recent violations and throttling actions."
  }
];

export default function PlaybackPage() {
  return (
    <PlaceholderPage
      title="Playback"
      description="Monitoring and controls for playback sessions."
      items={items}
    />
  );
}
