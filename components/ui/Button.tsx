import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  const baseStyles = 'font-medium rounded-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-kikwetu-orange hover:bg-kikwetu-orange-light text-white shadow-md hover:shadow-lg',
    secondary: 'bg-kikwetu-green hover:bg-kikwetu-green-light text-white shadow-md hover:shadow-lg',
    ghost: 'bg-transparent hover:bg-bg-secondary text-text-primary',
    outline: 'border-2 border-kikwetu-orange text-kikwetu-orange hover:bg-kikwetu-orange hover:text-white',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
