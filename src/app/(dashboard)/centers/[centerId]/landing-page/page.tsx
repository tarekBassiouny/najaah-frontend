import { Card, CardContent } from "@/components/ui/card";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { PageHeader } from "@/components/ui/page-header";
import { LandingPageEditor } from "@/features/centers/components/landing-page-editor";
import { getCenter } from "@/features/centers/services/centers.service";

type Params = {
  params: {
    centerId: string;
  };
};

function isUnbrandedCenterType(type: unknown) {
  if (type == null) return false;

  if (typeof type === "number") {
    return type === 0;
  }

  if (typeof type === "string") {
    const normalized = type.trim().toLowerCase();
    return normalized === "0" || normalized === "unbranded";
  }

  return false;
}

async function resolveCenter(centerId: string) {
  try {
    return await getCenter(centerId);
  } catch (error) {
    console.error("Unable to resolve center", error);
    return null;
  }
}

export default async function LandingPageRoute({ params }: Params) {
  const center = await resolveCenter(params.centerId);

  if (!center) {
    return (
      <AppNotFoundState
        scopeLabel="Center"
        title="Center not found"
        description="The landing page you are trying to open belongs to a center that no longer exists."
        primaryAction={{ href: "/centers", label: "Go to Centers" }}
      />
    );
  }

  const isUnbranded = isUnbrandedCenterType(center.type);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Center landing page"
        description="Manage the hero and about translations for your center-specific landing page."
      />
      {isUnbranded ? (
        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">
              Landing pages are only configurable for branded centers. Unbranded
              centers fallback to the system landing experience and do not have
              a dedicated editor.
            </p>
            <p className="text-xs text-gray-400">
              Convert the center to a branded tier if you need center-specific
              landing page configuration.
            </p>
          </CardContent>
        </Card>
      ) : (
        <LandingPageEditor centerId={params.centerId} />
      )}
    </div>
  );
}
