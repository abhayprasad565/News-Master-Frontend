import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-primary/30 bg-primary text-primary-foreground shadow-xs hover:brightness-105 dark:shadow-[0_0_12px_rgba(244,63,94,0.35)]',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-zinc-800/90 dark:border-white/10 dark:text-zinc-200',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow-xs hover:brightness-105',
        outline:
          'text-foreground border border-border/80 dark:border-white/15 dark:bg-zinc-900/40',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
