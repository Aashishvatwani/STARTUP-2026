import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gold-gradient text-black-primary hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:scale-[1.02]",
    outline: "border border-gold text-gold hover:bg-gold/10",
    ghost: "text-gold hover:text-gold-light hover:bg-white/5"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button 
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      suppressHydrationWarning
      {...props}
    >
      {children}
    </button>
  );
}
