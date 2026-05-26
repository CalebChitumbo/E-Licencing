import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "../../lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "violet" | "slate";
  trend?: { value: string; direction: "up" | "down" | "flat" };
  cta?: { label: string; to: string };
  loading?: boolean;
}

const tones: Record<NonNullable<Props["tone"]>, string> = {
  blue:   "bg-blue-50 text-blue-700",
  green:  "bg-green-50 text-green-700",
  amber:  "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  slate:  "bg-slate-100 text-slate-700",
};

export function Stat({ label, value, icon: Icon, tone = "blue", trend, cta, loading }: Props) {
  return (
    <div className="surface surface-hover p-5">
      <div className="flex items-start justify-between">
        <div className="text-sm text-slate-500">{label}</div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">
        {loading ? <span className="skeleton inline-block h-8 w-16" /> : value}
      </div>
      {trend && (
        <div className={cn(
          "mt-1 inline-flex items-center gap-1 text-xs",
          trend.direction === "up" ? "text-green-600" :
          trend.direction === "down" ? "text-red-600" : "text-slate-500",
        )}>
          {trend.direction === "up"   && <TrendingUp className="h-3 w-3" />}
          {trend.direction === "down" && <TrendingDown className="h-3 w-3" />}
          {trend.value}
        </div>
      )}
      {cta && (
        <Link to={cta.to} className="mt-3 inline-flex text-sm font-medium text-brand-500 hover:text-brand-600">
          {cta.label} →
        </Link>
      )}
    </div>
  );
}
