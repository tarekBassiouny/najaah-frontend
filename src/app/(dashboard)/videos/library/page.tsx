import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Search & Filters",
    "description": "Status, duration, and tag filters to be added."
  },
  {
    "title": "Video Table",
    "description": "Placeholder for title, course, encoding status, and last played."
  },
  {
    "title": "Bulk Actions",
    "description": "Retire, archive, or reprocess videos."
  }
];

export default function VideosLibraryPage() {
  return (
    <PlaceholderPage
      title="Video Library"
      description="Browse all uploaded videos with filters."
      items={items}
    />
  );
}
