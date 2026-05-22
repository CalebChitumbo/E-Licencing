import type { AuditEvent } from "../lib/types";
import { fmtDateTime } from "../lib/utils";

const ACTION_LABELS: Record<string, string> = {
  "application.created": "Application created",
  "application.submitted": "Submitted by applicant",
  "application.approved": "Approved",
  "application.rejected": "Rejected",
  "application.info_requested": "Information requested",
  "application.assigned": "Reassigned",
  "invoice.created": "Invoice issued",
  "invoice.proof_uploaded": "Proof of payment uploaded",
  "invoice.verified": "Payment verified",
  "licence.generated": "Licence issued",
  "document.uploaded": "Document uploaded",
};

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No activity yet.</p>;
  }
  return (
    <ol className="relative border-l border-slate-200 ml-2">
      {events.map((e) => (
        <li key={e.id} className="mb-5 ml-4">
          <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-sm font-medium">
              {ACTION_LABELS[e.action] || e.action}
            </div>
            <time className="text-xs text-slate-500">{fmtDateTime(e.timestamp)}</time>
          </div>
          <div className="text-xs text-slate-600">
            by {e.actor_uid} ({e.actor_role || "—"})
            {e.from_stage && e.to_stage && (
              <span className="ml-1 text-slate-400">
                · {e.from_stage} → {e.to_stage}
              </span>
            )}
          </div>
          {e.reason && (
            <div className="mt-1 text-sm italic text-slate-700">"{e.reason}"</div>
          )}
        </li>
      ))}
    </ol>
  );
}
