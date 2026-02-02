"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PdfsTable } from "@/features/pdfs/components/PdfsTable";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterPdfsPage({ params }: PageProps) {
  const { centerId } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Center PDFs"
        description="Manage PDFs for this center"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "PDFs" },
        ]}
        actions={
          <Link href={`/centers/${centerId}`}>
            <Button variant="outline">Back to Center</Button>
          </Link>
        }
      />
      <PdfsTable centerId={centerId} />
    </div>
  );
}
