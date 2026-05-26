import { ReactNode } from "react";
import {
  AlertCircle, CheckCircle2, Clock, FileSignature, FileText, HelpCircle, XCircle,
} from "lucide-react";

import type { ApplicationStatus, Stage } from "../../lib/types";
import { STAGE_LABELS } from "../../lib/types";
import { cn } from "../../lib/utils";

type Tone = "gray" | "blue" | "amber" | "green" | "red" | "violet";

const toneClasses: Record<Tone, string> = {
  gray:   "bg-slate-100 text-slate-700 ring-slate-200",
  blue:   "bg-blue-50 text-blue-700 ring-blue-200",
  amber:  "bg-amber-50 text-amber-800 ring-amber-200",
  green:  "bg-green-50 text-green-700 ring-green-200",
  red:    "bg-red-50 text-red-700 ring-red-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
};

interface BadgeProps {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ tone = "gray", icon, children, size = "sm", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

function statusMeta(status: string): { tone: Tone; icon: ReactNode; label: string } {
  switch (status) {
    case "draft":             return { tone: "gray",   icon: <FileText className="h-3.5 w-3.5" />,     label: "Draft" };
    case "payment_pending":   return { tone: "amber",  icon: <Clock className="h-3.5 w-3.5" />,        label: "Awaiting payment" };
    case "under_review":      return { tone: "blue",   icon: <Clock className="h-3.5 w-3.5" />,        label: "Under review" };
    case "info_requested":    return { tone: "amber",  icon: <HelpCircle className="h-3.5 w-3.5" />,   label: "Info requested" };
    case "rejected":          return { tone: "red",    icon: <XCircle className="h-3.5 w-3.5" />,      label: "Rejected" };
    case "licence_generated":
    case "active":            return { tone: "green",  icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: status === "active" ? "Active" : "Licence issued" };
    case "pending":           return { tone: "amber",  icon: <Clock className="h-3.5 w-3.5" />,        label: "Pending" };
    case "verified":          return { tone: "green",  icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Verified" };
    case "revoked":           return { tone: "red",    icon: <XCircle className="h-3.5 w-3.5" />,      label: "Revoked" };
    default:                  return { tone: "gray",   icon: <AlertCircle className="h-3.5 w-3.5" />,  label: status.replace(/_/g, " ") };
  }
}

export function StatusBadge({ status, size = "sm" }: { status: ApplicationStatus | string; size?: "sm" | "md" }) {
  const meta = statusMeta(status);
  return <Badge tone={meta.tone} icon={meta.icon} size={size}>{meta.label}</Badge>;
}

function stageMeta(stage: Stage | string): { tone: Tone; icon: ReactNode } {
  if (stage === "licence_generated") return { tone: "green",  icon: <FileSignature className="h-3.5 w-3.5" /> };
  if (stage === "rejected")          return { tone: "red",    icon: <XCircle className="h-3.5 w-3.5" /> };
  if (stage === "info_requested")    return { tone: "amber",  icon: <HelpCircle className="h-3.5 w-3.5" /> };
  if (stage === "draft")             return { tone: "gray",   icon: <FileText className="h-3.5 w-3.5" /> };
  if (stage === "submitted")         return { tone: "amber",  icon: <Clock className="h-3.5 w-3.5" /> };
  return { tone: "blue", icon: <Clock className="h-3.5 w-3.5" /> };
}

export function StageBadge({ stage, size = "sm" }: { stage: Stage; size?: "sm" | "md" }) {
  const meta = stageMeta(stage);
  return <Badge tone={meta.tone} icon={meta.icon} size={size}>{STAGE_LABELS[stage] || stage}</Badge>;
}
