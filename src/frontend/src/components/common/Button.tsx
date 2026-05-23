import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-[var(--duration-base,200ms)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-primary)] " +
  "disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-brand-primary)] text-[var(--color-text-inverse)] shadow-sm hover:opacity-90 hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-sm",
  secondary:
    "bg-[var(--color-bg-surface)] border border-[var(--color-border-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] hover:-translate-y-0.5 disabled:hover:translate-y-0",
  ghost:
    "bg-transparent border-0 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] disabled:hover:bg-transparent",
  destructive:
    "bg-[var(--color-status-danger)] text-[var(--color-text-inverse)] shadow-sm hover:opacity-90 hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  leftIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <Loader2
          className="animate-spin shrink-0"
          size={size === "lg" ? 18 : 15}
        />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
