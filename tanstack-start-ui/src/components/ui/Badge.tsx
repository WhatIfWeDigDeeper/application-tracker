import { cn } from "../../lib/utils";
import type { ApplicationStatus } from "../../types/application";
import { STATUS_COLORS, APPLICATION_STATUSES } from "../../lib/constants";

interface BadgeProps {
  status: ApplicationStatus;
  size?: "sm" | "md";
}

export function Badge({ status, size = "md" }: BadgeProps) {
  const label = APPLICATION_STATUSES.find((s) => s.value === status)?.label || status;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        STATUS_COLORS[status],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      )}
    >
      {label}
    </span>
  );
}
