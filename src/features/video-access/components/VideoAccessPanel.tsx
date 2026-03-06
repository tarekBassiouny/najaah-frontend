"use client";

import { useState } from "react";
import { VideoAccessCodesTable } from "@/features/video-access/components/VideoAccessCodesTable";
import { VideoAccessRequestsTable } from "@/features/video-access/components/VideoAccessRequestsTable";
import { cn } from "@/lib/utils";

type VideoAccessPanelTab = "requests" | "codes";

type VideoAccessPanelProps = {
  centerId?: string | number;
  showCenterFilter?: boolean;
  initialTab?: VideoAccessPanelTab;
};

const TABS: Array<{
  key: VideoAccessPanelTab;
  label: string;
  description: string;
}> = [
  {
    key: "requests",
    label: "Access Requests",
    description: "Review pending and processed student access requests.",
  },
  {
    key: "codes",
    label: "Access Codes",
    description: "Generate, manage, and send video access codes.",
  },
];

export function VideoAccessPanel({
  centerId,
  showCenterFilter = true,
  initialTab = "requests",
}: VideoAccessPanelProps) {
  const [activeTab, setActiveTab] = useState<VideoAccessPanelTab>(initialTab);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                className={cn(
                  "rounded-lg px-3 py-2 text-left transition-colors",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
                )}
                onClick={() => setActiveTab(tab.key)}
              >
                <p className="text-sm font-medium">{tab.label}</p>
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    isActive
                      ? "text-white/85"
                      : "text-gray-500 dark:text-gray-400",
                  )}
                >
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "requests" ? (
        <VideoAccessRequestsTable
          hideHeader
          centerId={centerId}
          showCenterFilter={showCenterFilter}
        />
      ) : (
        <VideoAccessCodesTable
          hideHeader
          centerId={centerId}
          showCenterFilter={showCenterFilter}
        />
      )}
    </div>
  );
}
