import { PlaceholderPage } from "@/components/ui/placeholder-page";

const items = [
  {
    title: "Encoding",
    description: "Bitrate ladders and codec presets.",
  },
  {
    title: "Captions",
    description: "Caption defaults and required languages.",
  },
  {
    title: "DRM",
    description: "Key rotation and token lifetimes.",
  },
];

export default function SettingsVideoSettingsPage() {
  return (
    <PlaceholderPage
      title="Video Settings"
      description="Defaults for video encoding and playback."
      items={items}
    />
  );
}
