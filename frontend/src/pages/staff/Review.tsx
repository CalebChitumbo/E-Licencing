import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { AuditTimeline } from "../../components/AuditTimeline";
import { Alert } from "../../components/ui/Alert";
import { StageBadge, StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton, SkeletonText } from "../../components/ui/Skeleton";
import { toast } from "../../components/ui/Toaster";
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
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");

  async function confirm() {
    if (!pendingAction) return;
    if ((pendingAction === "reject" || pendingAction === "request_info") && !reason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }
    try {
      await transition.mutateAsync({ action: pendingAction, reason });
      const msg = pendingAction === "approve" ? "Approved and advanced."
                : pendingAction === "reject"  ? "Application rejected."
                : "Information requested.";
      toast.success(msg);
      setPendingAction(null);
      setReason("");
    } catch (err) {
      toast.error(asApiError(err).detail);
    }
  }

  if (app.isLoading) return <SkeletonText lines={6} />;
  if (!app.data) return <Alert tone="error">Application not found.</Alert>;
  const a = app.data;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Queue", to: "/staff/queue" },
          { label: a.facility_snapshot?.name || a.facility_id },
        ]}
        title={a.facility_snapshot?.name || a.facility_id}
        description={`${a.form_type} · Applicant ${a.applicant_uid} · Submitted ${fmtDate(a.submitted_at)} · Fee ${fmtMoney(a.fee_amount)}`}
        actions={
          <>
            <StatusBadge status={a.status} size="md" />
            <StageBadge stage={a.current_stage} size="md" />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader eyebrow="Snapshot at submission">Facility</CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 gap-y-2 text-sm md:grid-cols-2">
                <Row k="Type"     v={a.facility_snapshot?.type} />
                <Row k="PACRA"    v={a.facility_snapshot?.pacra_number} />
                <Row k="Province" v={a.facility_snapshot?.province} />
                <Row k="District" v={a.facility_snapshot?.district} />
                <Row k="Address"  v={a.facility_snapshot?.address} wide />
                <Row k="RPO"      v={`${a.facility_snapshot?.rpo?.name || "—"} (${a.facility_snapshot?.rpo?.phone || "—"})`} wide />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>Wizard responses</CardHeader>
            <CardBody>
              {Object.entries(a.wizard_data || {}).length === 0
                ? <p className="text-sm text-slate-500">No wizard data captured.</p>
                : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {Object.entries(a.wizard_data || {}).map(([stepKey, payload]) => (
                      <div key={stepKey} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {stepKey.replace("_", " ")}
                        </div>
                        <div className="space-y-1 text-sm">
                          {Object.entries(payload as Record<string, string>).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-xs text-slate-500">{k.replace(/_/g, " ")}: </span>
                              <span className="text-slate-800">{String(v) || "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>Decision</CardHeader>
            <CardBody className="space-y-3">
              <p className="text-xs text-slate-500">
                Approve to advance the application. Use "Request info" if the applicant must
                supply more detail. Rejection is terminal.
              </p>
              <Button variant="accent" className="w-full" icon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() => setPendingAction("approve")}>
                Approve & advance
              </Button>
              <Button variant="outline" className="w-full" icon={<HelpCircle className="h-4 w-4" />}
                      onClick={() => setPendingAction("request_info")}>
                Request more information
              </Button>
              <Button variant="danger" className="w-full" icon={<XCircle className="h-4 w-4" />}
                      onClick={() => setPendingAction("reject")}>
                Reject
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>Audit trail</CardHeader>
            <CardBody>
              {audit.isLoading ? <SkeletonText lines={4} /> :
                <AuditTimeline events={audit.data?.results ?? []} />}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={pendingAction !== null}
        onClose={() => { setPendingAction(null); setReason(""); }}
        title={
          pendingAction === "approve"      ? "Approve application"
          : pendingAction === "reject"     ? "Reject application"
          : pendingAction === "request_info" ? "Request more information"
          : ""
        }
        description={
          pendingAction === "approve"
            ? "The application will advance to the next stage of the workflow."
            : pendingAction === "reject"
            ? "Rejection is terminal — the applicant will be notified and must start a new application."
            : "The applicant will be notified and asked to provide the missing detail."
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => { setPendingAction(null); setReason(""); }}>Cancel</Button>
            <Button
              variant={pendingAction === "reject" ? "danger" : pendingAction === "approve" ? "accent" : "primary"}
              loading={transition.isPending}
              onClick={confirm}
            >
              Confirm
            </Button>
          </>
        }
      >
        {pendingAction !== "approve" && (
          <div>
            <label className="label">Reason (required)</label>
            <textarea className="input min-h-[100px]" value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Provide the specific reason the applicant needs to see…" />
          </div>
        )}
        {pendingAction === "approve" && (
          <div>
            <label className="label">Internal note (optional)</label>
            <textarea className="input min-h-[80px]" value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Optional comment for the audit trail" />
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ k, v, wide }: { k: string; v?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <span className="text-slate-500">{k}: </span>
      <span className="text-slate-800">{v || "—"}</span>
    </div>
  );
}

function SkeletonHeader() {
  return <Skeleton className="h-8 w-64" />;
}
SkeletonHeader.displayName = "SkeletonHeader";
