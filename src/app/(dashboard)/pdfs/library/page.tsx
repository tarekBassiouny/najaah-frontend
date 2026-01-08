import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Search & Filters",
    "description": "Course, owner, and status filters."
  },
  {
    "title": "Document Table",
    "description": "Placeholder for filename, course link, and last updated."
  },
  {
    "title": "Bulk Actions",
    "description": "Archive, replace, or export selections."
  }
];

export default function PdfsLibraryPage() {
  return (
    <PlaceholderPage
      title="PDF Library"
      description="Library of uploaded documents."
      items={items}
    />
  );
}
