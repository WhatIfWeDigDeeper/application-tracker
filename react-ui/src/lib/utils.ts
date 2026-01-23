export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSalaryRange(
  min: number | null,
  max: number | null
): string {
  if (min && max) {
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }
  if (min) {
    return `From ${formatCurrency(min)}`;
  }
  if (max) {
    return `Up to ${formatCurrency(max)}`;
  }
  return "";
}

export function getDaysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isOverdue(dateString: string | null): boolean {
  const days = getDaysUntil(dateString);
  return days !== null && days < 0;
}

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}
