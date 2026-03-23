"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SettingsSectionCardProps = {
  title: string;
  description?: string | null;
  groupId?: string;
  children: React.ReactNode;
};

export function SettingsSectionCard({
  title,
  description,
  groupId,
  children,
}: SettingsSectionCardProps) {
  return (
    <Card
      className="overflow-hidden border-gray-200/80 shadow-sm dark:border-gray-800"
      data-settings-group={groupId}
    >
      <CardHeader className="border-b border-gray-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_50%,#ecfeff_100%)] dark:border-gray-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(17,24,39,0.96)_50%,rgba(8,47,73,0.88)_100%)]">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-5 p-6">{children}</CardContent>
    </Card>
  );
}
