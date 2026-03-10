import type { ReactNode } from 'react';

const variantClasses = {
  primary: 'text-white hover:opacity-90 disabled:opacity-40',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
};

interface ButtonProps {
  variant?: keyof typeof variantClasses;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children: ReactNode;
  className?: string;
  'data-testid'?: string;
}

export function Button({
  variant = 'primary',
  onClick,
  disabled,
  type = 'button',
  children,
  className = '',
  'data-testid': dataTestId,
}: ButtonProps) {
  const inlineStyle = variant === 'primary' ? { background: 'var(--gql-pink)' } : undefined;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={dataTestId}
      style={inlineStyle}
      className={`px-4 py-2 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
