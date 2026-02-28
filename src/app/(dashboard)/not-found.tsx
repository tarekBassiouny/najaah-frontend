import { AppNotFoundState } from "@/components/ui/app-not-found-state";

export default function DashboardNotFoundPage() {
  return (
    <AppNotFoundState
      scopeLabel="Admin Dashboard"
      title="Page not found"
      description="The page you requested does not exist or is no longer available."
      primaryAction={{ href: "/dashboard", label: "Go to Dashboard" }}
      secondaryAction={{
        href: "/centers",
        label: "Go to Centers",
        variant: "outline",
      }}
    />
  );
}
