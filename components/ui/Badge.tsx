import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'verified' | 'live' | 'expert' | 'success' | 'warning';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center gap-1 rounded-full font-medium transition';
  
  const variantStyles = {
    default: 'bg-bg-tertiary text-text-primary',
    verified: 'bg-accent-verified bg-opacity-20 text-accent-verified',
    live: 'bg-accent-live bg-opacity-20 text-accent-live animate-pulse',
    expert: 'bg-kikwetu-orange bg-opacity-20 text-kikwetu-orange',
    success: 'bg-accent-success bg-opacity-20 text-accent-success',
    warning: 'bg-accent-warning bg-opacity-20 text-accent-warning',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
