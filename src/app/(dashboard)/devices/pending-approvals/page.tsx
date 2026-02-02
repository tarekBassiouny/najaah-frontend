import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Queue",
    description: "Device fingerprints, submitted by, and requested courses.",
  },
  {
    title: "Decisions",
    description: "Approve, reject, or request info actions.",
  },
  {
    title: "Audit",
    description: "Decision history and notes placeholders.",
  },
];

export default function DevicesPendingApprovalsPage() {
  return (
    <PlaceholderPage
      title="Pending Approvals"
      description="Review devices awaiting approval."
      items={items}
    />
  );
}
