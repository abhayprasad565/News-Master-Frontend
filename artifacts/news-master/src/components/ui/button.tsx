import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.97] active:duration-75 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:brightness-105 hover:shadow-[0_0_16px_rgba(225,29,72,0.3)] dark:hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] active:brightness-95 border border-primary/20 dark:border-white/15 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:brightness-105 active:brightness-95 border border-destructive/30',
        outline:
          'border border-border/80 dark:border-white/15 bg-background/80 dark:bg-zinc-900/60 backdrop-blur-sm hover:bg-accent/80 hover:text-accent-foreground dark:hover:bg-zinc-800/80 dark:hover:border-white/25 active:bg-accent/90 shadow-xs dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border dark:border-white/10 dark:text-zinc-100 shadow-xs',
        ghost:
          'border border-transparent hover:bg-accent hover:text-accent-foreground dark:hover:bg-white/[0.08] dark:hover:text-white',
        link:
          'text-primary underline-offset-4 hover:underline active:opacity-80',
      },
      size: {
        default: 'min-h-9 px-4 py-2',
        sm: 'min-h-8 rounded-md px-3 text-xs',
        lg: 'min-h-10 rounded-md px-8 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
