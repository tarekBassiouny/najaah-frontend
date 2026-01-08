import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Pipelines",
    "description": "Stages for encoding, transcription, and packaging."
  },
  {
    "title": "Health",
    "description": "Error rates and retry queues."
  },
  {
    "title": "SLAs",
    "description": "Processing time targets and alerts."
  }
];

export default function VideosProcessingStatusPage() {
  return (
    <PlaceholderPage
      title="Processing Status"
      description="Monitor encoding, transcription, and DRM jobs."
      items={items}
    />
  );
}
