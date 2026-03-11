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
import { useTranslation } from "@/features/localization";

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
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t(
            "auto.features.centers.components.forms.centerprimaryadminform.s1",
          )}
        </CardTitle>
        <CardDescription>
          {t(
            "auto.features.centers.components.forms.centerprimaryadminform.s2",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-name">
            {t(
              "auto.features.centers.components.forms.centerprimaryadminform.s3",
            )}
          </Label>
          <Input
            id="admin-name"
            value={adminName}
            onChange={(event) => onAdminNameChange(event.target.value)}
            placeholder={t(
              "auto.features.centers.components.forms.centerprimaryadminform.s4",
            )}
            required
            className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-email">
            {t(
              "auto.features.centers.components.forms.centerprimaryadminform.s5",
            )}
          </Label>
          <Input
            id="admin-email"
            type="email"
            value={adminEmail}
            onChange={(event) => onAdminEmailChange(event.target.value)}
            placeholder={t(
              "auto.features.centers.components.forms.centerprimaryadminform.s6",
            )}
            required
            className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        </div>
      </CardContent>
    </Card>
  );
}
