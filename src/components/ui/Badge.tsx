import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/types/application';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';

export interface BadgeProps {
  children?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps): ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Status-specific badge component
 */
export interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps): ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        STATUS_COLORS[status],
        sizeClasses[size],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
