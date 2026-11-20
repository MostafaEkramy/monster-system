import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2CEE55] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-95',
  {
    variants: {
      variant: {
        default:
          'bg-[#2CEE55] text-[#070A08] hover:bg-[#3BF362] hover:shadow-[0_0_25px_rgba(44,238,85,0.4)] shadow-[0_0_15px_rgba(44,238,85,0.2)]',
        destructive:
          'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
        outline:
          'border border-border-color bg-[#0C120E]/50 text-primary hover:border-[#2CEE55]/60 hover:text-[#2CEE55] hover:bg-[#111A13]',
        secondary:
          'bg-elevated text-primary hover:bg-card border border-border-color hover:border-[#2CEE55]/40',
        ghost:
          'hover:bg-elevated text-secondary hover:text-primary',
        link: 'text-[#2CEE55] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-full px-3 text-xs',
        lg: 'h-11 rounded-full px-8 text-base',
        icon: 'h-10 w-10 p-0 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
