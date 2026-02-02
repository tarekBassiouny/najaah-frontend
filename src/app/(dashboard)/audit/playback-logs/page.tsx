import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Events",
    description: "Session starts, stops, and violations.",
  },
  {
    title: "Correlations",
    description: "Link to device, student, and course context.",
  },
  {
    title: "Exports",
    description: "Batch exports for investigations.",
  },
];

export default function AuditPlaybackLogsPage() {
  return (
    <PlaceholderPage
      title="Playback Logs"
      description="Playback-specific audit stream."
      items={items}
    />
  );
}
