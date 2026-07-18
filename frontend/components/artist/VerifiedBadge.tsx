import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <Badge variant="info" className={cn("gap-1", className)}>
      <span aria-hidden="true">✓</span>
      Verified artist
    </Badge>
  );
}
