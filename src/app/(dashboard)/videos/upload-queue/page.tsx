import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Pending Uploads",
    description: "Filename, owner, size, and remaining time placeholders.",
  },
  {
    title: "Errors",
    description: "Retry guidance and failure reasons.",
  },
  {
    title: "Recent Completions",
    description: "Successful ingests with timestamps.",
  },
];

export default function VideosUploadQueuePage() {
  return (
    <PlaceholderPage
      title="Upload Queue"
      description="Track uploads in progress."
      items={items}
    />
  );
}
