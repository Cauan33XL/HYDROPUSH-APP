/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from 'motion/react';

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-auto min-h-[2.25rem] px-4 py-2 has-[>svg]:px-3 rounded-xl",
        sm: "h-auto min-h-[2rem] rounded-xl gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-9 px-5 sm:h-10 sm:px-6 rounded-xl",
        icon: "size-8 sm:size-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    } catch {
      // fallback: keep animations enabled
    }
  }, []);

  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        style={{ borderRadius: '0.75rem', ...(style as React.CSSProperties) }}
        {...props}
      />
    );
  }

  type MotionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    whileHover?: unknown;
    whileTap?: unknown;
    transition?: unknown;
  };

  const MotionComp = motion.button as unknown as React.ComponentType<MotionButtonProps>;

  const mergedStyle = {
    borderRadius: '0.75rem',
    boxShadow: 'var(--shadow-subtle)',
    ...(style as React.CSSProperties),
    ...((props as any)?.style || {}),
  } as React.CSSProperties;

  return (
    <MotionComp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }), "shadow-sm hover:shadow-md active:shadow-sm")}
      style={mergedStyle}
      whileHover={!reducedMotion ? { scale: 1.02 } : undefined}
      whileTap={!reducedMotion ? { scale: 0.975 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      {...(props as MotionButtonProps)}
    />
  );
}

export { Button, buttonVariants };
