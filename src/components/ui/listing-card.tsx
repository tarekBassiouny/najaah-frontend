import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ListingCardProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ListingCard({
  children,
  className,
  contentClassName,
}: ListingCardProps) {
  return (
    <Card className={className}>
      <CardContent className={cn("p-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
