import { useState } from "react";
import { useParams } from "react-router-dom";

import { AuditTimeline } from "../../components/AuditTimeline";
import { ErrorBox, Spinner } from "../../components/Spinner";
import { StageBadge, StatusBadge } from "../../components/StatusBadge";
import { asApiError } from "../../lib/api";
import {
  useApplication,
  useApplicationAudit,
  useTransition,
} from "../../lib/queries";
import { fmtDate, fmtMoney } from "../../lib/utils";

type Action = "approve" | "reject" | "request_info";

export function ApplicationReviewPage() {
  const { id } = useParams();
  const app = useApplication(id);
  const audit = useApplicationAudit(id);
  const transition = useTransition(id || "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function act(action: Action) {
    setError(null);
    if ((action === "reject" || action === "request_info") && !reason.trim()) {
      return setError("Please provide a reason.");
    }
    try {
      await transition.mutateAsync({ action, reason });
      setReason("");
    } catch (err) {
      setError(asApiError(err).detail);
    }
  }

  if (app.isLoading) return <Spinner />;
  if (!app.data) return <ErrorBox>Application not found.</ErrorBox>;
  const a = app.data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="card">
          <div className="card-body flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">{a.form_type}</div>
              <div className="text-xl font-semibold">
                {a.facility_snapshot?.name || a.facility_id}
              </div>
              <div className="text-xs text-slate-500">
                Applicant {a.applicant_uid} · submitted {fmtDate(a.submitted_at)} · fee {fmtMoney(a.fee_amount)}
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <StatusBadge status={a.status} />
              <StageBadge stage={a.current_stage} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Facility snapshot</div>
          <div className="card-body text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
            <div><span className="text-slate-500">Type:</span> {a.facility_snapshot?.type}</div>
            <div><span className="text-slate-500">PACRA:</span> {a.facility_snapshot?.pacra_number}</div>
            <div><span className="text-slate-500">Province:</span> {a.facility_snapshot?.province}</div>
            <div><span className="text-slate-500">District:</span> {a.facility_snapshot?.district}</div>
            <div className="md:col-span-2">
              <span className="text-slate-500">Address:</span> {a.facility_snapshot?.address}
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-500">RPO:</span> {a.facility_snapshot?.rpo?.name} ({a.facility_snapshot?.rpo?.phone})
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Wizard responses</div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {Object.entries(a.wizard_data || {}).map(([stepKey, payload]) => (
              <div key={stepKey} className="rounded border border-slate-100 p-3">
                <div className="font-medium mb-2">{stepKey}</div>
                {Object.entries(payload as Record<string, string>).map(([k, v]) => (
                  <div key={k} className="text-xs">
                    <span className="text-slate-500">{k}:</span> {String(v)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card">
          <div className="card-header">Decision</div>
          <div className="card-body space-y-3">
            {error && <ErrorBox>{error}</ErrorBox>}
            <div>
              <label className="label">Reason / note</label>
              <textarea
                className="input min-h-[80px]" value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Required for reject / request info"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => act("approve")} className="btn-accent" disabled={transition.isPending}>
                Approve & advance
              </button>
              <button onClick={() => act("request_info")} className="btn-outline" disabled={transition.isPending}>
                Request more information
              </button>
              <button onClick={() => act("reject")} className="btn-danger" disabled={transition.isPending}>
                Reject
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Audit trail</div>
          <div className="card-body">
            {audit.isLoading
              ? <Spinner />
              : <AuditTimeline events={audit.data?.results ?? []} />}
          </div>
        </div>
      </div>
    </div>
  );
}
