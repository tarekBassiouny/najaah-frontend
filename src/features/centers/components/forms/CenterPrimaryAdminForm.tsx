"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CenterPrimaryAdminFormProps = {
  adminName: string;
  adminEmail: string;
  onAdminNameChange: (_name: string) => void;
  onAdminEmailChange: (_email: string) => void;
};

export function CenterPrimaryAdminForm({
  adminName,
  adminEmail,
  onAdminNameChange,
  onAdminEmailChange,
}: CenterPrimaryAdminFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Primary Admin</CardTitle>
        <CardDescription>
          This admin becomes the center owner on creation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-name">Admin Name *</Label>
          <Input
            id="admin-name"
            value={adminName}
            onChange={(event) => onAdminNameChange(event.target.value)}
            placeholder="e.g., Jane Doe"
            required
            className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-email">Admin Email *</Label>
          <Input
            id="admin-email"
            type="email"
            value={adminEmail}
            onChange={(event) => onAdminEmailChange(event.target.value)}
            placeholder="admin@example.com"
            required
            className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        </div>
      </CardContent>
    </Card>
  );
}
