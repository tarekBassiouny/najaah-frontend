"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CentersTable } from "@/features/centers/components/CentersTable";

export default function CentersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Centers"
        description="Manage training centers across your platform"
        actions={
          <Link href="/centers/create">
            <Button>
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Center
            </Button>
          </Link>
        }
      />

      <CentersTable />
    </div>
  );
}
