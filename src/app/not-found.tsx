import { AppNotFoundState } from "@/components/ui/app-not-found-state";

export default function GlobalNotFoundPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppNotFoundState
        title="Page not found"
        description="The page you requested does not exist or is no longer available."
        primaryAction={{ href: "/dashboard", label: "Go to Dashboard" }}
        secondaryAction={{
          href: "/login",
          label: "Go to Login",
          variant: "outline",
        }}
      />
    </main>
  );
}
