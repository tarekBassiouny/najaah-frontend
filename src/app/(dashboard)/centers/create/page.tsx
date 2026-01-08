import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    "title": "Details",
    "description": "Name, code, locale, and primary contact inputs."
  },
  {
    "title": "Access",
    "description": "Assign admins, reviewers, and notification preferences."
  },
  {
    "title": "Compliance",
    "description": "Attach docs and set review cadence."
  }
];

export default function CentersCreatePage() {
  return (
    <PlaceholderPage
      title="Create Center"
      description="Wizard-style flow to add a new center."
      items={items}
    />
  );
}
