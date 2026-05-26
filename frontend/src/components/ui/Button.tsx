import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "../../lib/utils";

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:bg-brand-700 focus:ring-brand-500/40",
  accent:  "bg-accent-500 text-white shadow-sm hover:bg-accent-600 active:bg-accent-600 focus:ring-accent-500/40",
  outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 focus:ring-slate-400/40",
  ghost:   "text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-400/40",
  subtle:  "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400/40",
  danger:  "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus:ring-red-500/40",
};

const sizes: Record<Size, string> = {
  sm:   "h-8  px-3 text-xs gap-1.5",
  md:   "h-10 px-4 text-sm gap-2",
  lg:   "h-11 px-5 text-base gap-2",
  icon: "h-9 w-9 p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, icon, iconRight, children, disabled, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-lg font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});
