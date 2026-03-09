import { PageHeader } from "@/components/ui/page-header";
import { LandingPageEditor } from "@/features/centers/components/landing-page-editor";

type Params = {
  params: {
    centerId: string;
  };
};

export default function LandingPageRoute({ params }: Params) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Center landing page"
        description="Manage the hero and about translations for your center-specific landing page."
      />
      <LandingPageEditor centerId={params.centerId} />
    </div>
  );
}
