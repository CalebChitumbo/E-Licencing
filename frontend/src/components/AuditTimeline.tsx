import {
  AlertCircle,
  CheckCircle2,
  FileSignature,
  FilePlus,
  FileUp,
  HelpCircle,
  Receipt,
  Send,
  UserCog,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { AuditEvent } from "../lib/types";
import { cn, fmtDateTime } from "../lib/utils";

type EventMeta = { label: string; icon: LucideIcon; tone: string; ring: string };

const ACTION_META: Record<string, EventMeta> = {
  "application.created":         { label: "Application created",       icon: FilePlus,      tone: "text-slate-600",  ring: "ring-slate-200 bg-slate-50" },
  "application.submitted":       { label: "Submitted by applicant",    icon: Send,          tone: "text-blue-600",   ring: "ring-blue-200 bg-blue-50" },
  "application.approved":        { label: "Approved",                  icon: CheckCircle2,  tone: "text-green-600",  ring: "ring-green-200 bg-green-50" },
  "application.rejected":        { label: "Rejected",                  icon: XCircle,       tone: "text-red-600",    ring: "ring-red-200 bg-red-50" },
  "application.info_requested":  { label: "Information requested",     icon: HelpCircle,    tone: "text-amber-600",  ring: "ring-amber-200 bg-amber-50" },
  "application.assigned":        { label: "Reassigned",                icon: UserCog,       tone: "text-violet-600", ring: "ring-violet-200 bg-violet-50" },
  "invoice.created":             { label: "Invoice issued",            icon: Receipt,       tone: "text-slate-600",  ring: "ring-slate-200 bg-slate-50" },
  "invoice.proof_uploaded":      { label: "Proof of payment uploaded", icon: FileUp,        tone: "text-blue-600",   ring: "ring-blue-200 bg-blue-50" },
  "invoice.verified":            { label: "Payment verified",          icon: Wallet,        tone: "text-green-600",  ring: "ring-green-200 bg-green-50" },
  "licence.generated":           { label: "Licence issued",            icon: FileSignature, tone: "text-green-700",  ring: "ring-green-300 bg-green-100" },
  "document.uploaded":           { label: "Document uploaded",         icon: FileUp,        tone: "text-blue-600",   ring: "ring-blue-200 bg-blue-50" },
};

function metaFor(action: string): EventMeta {
  return ACTION_META[action] || { label: action, icon: AlertCircle, tone: "text-slate-600", ring: "ring-slate-200 bg-slate-50" };
}

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No activity yet.</p>;
  }
  return (
    <ol className="relative space-y-5 pl-8">
      <span className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200" aria-hidden />
      {events.map((e) => {
        const meta = metaFor(e.action);
        const Icon = meta.icon;
        return (
          <li key={e.id} className="relative">
            <span className={cn(
              "absolute -left-[33px] top-0 flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white",
              meta.ring,
            )}>
              <Icon className={cn("h-4 w-4", meta.tone)} />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-sm font-medium text-slate-900">{meta.label}</div>
              <time className="text-xs text-slate-500">{fmtDateTime(e.timestamp)}</time>
            </div>
            <div className="text-xs text-slate-600">
              by <span className="font-medium">{e.actor_uid}</span>
              {e.actor_role && <span className="text-slate-500"> · {e.actor_role}</span>}
              {e.from_stage && e.to_stage && (
                <span className="ml-1 text-slate-400">
                  · {e.from_stage} → {e.to_stage}
                </span>
              )}
            </div>
            {e.reason && (
              <div className="mt-1.5 rounded-md border-l-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm italic text-slate-700">
                "{e.reason}"
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
