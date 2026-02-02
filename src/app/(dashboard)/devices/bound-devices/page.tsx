import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Bindings",
    description: "Student, device ID, last seen, and expiry.",
  },
  {
    title: "Compliance",
    description: "OS version, jailbreak/root signals, and health.",
  },
  {
    title: "Overrides",
    description: "Temporary exemptions and expiry timers.",
  },
];

export default function DevicesBoundDevicesPage() {
  return (
    <PlaceholderPage
      title="Bound Devices"
      description="Devices currently bound to students."
      items={items}
    />
  );
}
