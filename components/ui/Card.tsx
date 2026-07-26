import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-lg transition';
  const variantStyles = {
    default: 'bg-bg-primary border border-border-light',
    elevated: 'bg-bg-primary shadow-md',
    outlined: 'bg-transparent border-2 border-border-light',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};
