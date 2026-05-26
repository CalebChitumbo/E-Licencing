import { ArrowLeft, ArrowRight, ExternalLink, FileSignature, Save, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AuditTimeline } from "../../components/AuditTimeline";
import { Alert } from "../../components/ui/Alert";
import { StageBadge, StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton, SkeletonText } from "../../components/ui/Skeleton";
import { Stepper, type Step } from "../../components/ui/Stepper";
import { toast } from "../../components/ui/Toaster";
import { asApiError } from "../../lib/api";
import {
  useApplication,
  useApplicationAudit,
  useSubmitApplication,
  useUpdateWizard,
} from "../../lib/queries";
import { fmtDate, fmtMoney } from "../../lib/utils";

const WIZARD_STEPS: Array<Step & { fields: { key: string; label: string; type?: "text" | "textarea" | "number" }[] }> = [
  { key: "s1", title: "Applicant", description: "Contact details", fields: [
    { key: "applicant_name", label: "Applicant name" },
    { key: "contact_phone",  label: "Contact phone" },
    { key: "contact_email",  label: "Contact email" },
  ]},
  { key: "s2", title: "Practice", description: "Scope of work", fields: [
    { key: "practice_type",     label: "Practice type" },
    { key: "workload_summary",  label: "Annual workload (procedures / patients)", type: "textarea" },
    { key: "personnel_count",   label: "Personnel count", type: "number" },
  ]},
  { key: "s3", title: "Sources",  description: "Equipment summary", fields: [
    { key: "source_summary",    label: "Source / equipment summary", type: "textarea" },
    { key: "shielding_summary", label: "Shielding summary", type: "textarea" },
  ]},
  { key: "s4", title: "Safety",   description: "Training & emergency", fields: [
    { key: "training_records",        label: "Personnel training records" },
    { key: "dosimetry_provider",      label: "Dosimetry provider" },
    { key: "emergency_plan_summary",  label: "Emergency plan summary", type: "textarea" },
  ]},
];

export function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const app = useApplication(id);
  const audit = useApplicationAudit(id);
  const submit = useSubmitApplication(id || "");
  const updateWizard = useUpdateWizard(id || "");

  const [stepIdx, setStepIdx] = useState(0);
  const [pending, setPending] = useState<Record<string, string>>({});

  const a = app.data;
  const editable = a?.current_stage === "draft" || a?.current_stage === "info_requested";
  const currentStep = WIZARD_STEPS[stepIdx];

  const saved = useMemo(
    () => (a?.wizard_data?.[`step_${stepIdx + 1}`] as Record<string, string> | undefined) || {},
    [a, stepIdx],
  );

  async function saveAndAdvance(direction: "next" | "stay" | "submit") {
    try {
      if (Object.keys(pending).length) {
        await updateWizard.mutateAsync({ step: stepIdx + 1, data: { ...saved, ...pending } });
        setPending({});
        if (direction === "stay") toast.success("Step saved.");
      }
      if (direction === "next" && stepIdx < WIZARD_STEPS.length - 1) {
        setStepIdx(stepIdx + 1);
      } else if (direction === "submit") {
        const result = await submit.mutateAsync();
        toast.success("Application submitted. Invoice generated.");
        navigate(`/app/payments?invoice=${result.invoice_id}`);
      }
    } catch (err) {
      toast.error(asApiError(err).detail);
    }
  }

  if (app.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <SkeletonText lines={5} />
      </div>
    );
  }
  if (!a) return <Alert tone="error">Application not found.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Applications", to: "/app/applications" },
          { label: a.facility_snapshot?.name || a.facility_id },
        ]}
        title={a.facility_snapshot?.name || a.facility_id}
        description={`${a.form_type} application · created ${fmtDate(a.created_at)} · fee ${fmtMoney(a.fee_amount)}`}
        actions={
          <>
            <StatusBadge status={a.status} size="md" />
            <StageBadge stage={a.current_stage} size="md" />
          </>
        }
      />

      <Card>
        <CardBody>
          <Stepper
            steps={WIZARD_STEPS}
            current={stepIdx}
            onJump={editable ? (i) => setStepIdx(i) : undefined}
          />
        </CardBody>
      </Card>

      {a.info_request?.reason && (
        <Alert tone="warning" title="Information requested">
          {a.info_request.reason}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {editable ? (
            <Card>
              <CardHeader eyebrow={`Step ${stepIdx + 1} of ${WIZARD_STEPS.length}`}>
                {currentStep.title}
              </CardHeader>
              <CardBody className="space-y-4">
                {currentStep.fields.map((f) => (
                  <div key={f.key}>
                    <label className="label">{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea
                        className="input min-h-[80px]"
                        defaultValue={saved[f.key] || ""}
                        onBlur={(e) => setPending((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    ) : (
                      <input
                        type={f.type === "number" ? "number" : "text"}
                        className="input"
                        defaultValue={saved[f.key] || ""}
                        onBlur={(e) => setPending((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <Button
                    variant="ghost"
                    disabled={stepIdx === 0}
                    onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                    icon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Previous
                  </Button>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => saveAndAdvance("stay")} icon={<Save className="h-4 w-4" />}
                            loading={updateWizard.isPending}>
                      Save step
                    </Button>
                    {stepIdx < WIZARD_STEPS.length - 1 ? (
                      <Button onClick={() => saveAndAdvance("next")} iconRight={<ArrowRight className="h-4 w-4" />}>
                        Next
                      </Button>
                    ) : (
                      <Button variant="accent" onClick={() => saveAndAdvance("submit")}
                              icon={<Send className="h-4 w-4" />} loading={submit.isPending}>
                        Submit application
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader>Submitted wizard data</CardHeader>
              <CardBody>
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
                            <span>{String(v) || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {a.licence_id && (
            <Card>
              <CardBody className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700">
                    <FileSignature className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">Licence issued</div>
                    <div className="font-mono text-base">{a.licence_id}</div>
                  </div>
                </div>
                <a
                  href={`${import.meta.env.VITE_PUBLIC_VERIFY_URL || "/verify"}/${a.licence_id}`}
                  target="_blank" rel="noreferrer"
                >
                  <Button variant="outline" size="sm" iconRight={<ExternalLink className="h-4 w-4" />}>
                    Public verification
                  </Button>
                </a>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>Audit trail</CardHeader>
            <CardBody>
              {audit.isLoading ? <SkeletonText lines={4} /> :
                <AuditTimeline events={audit.data?.results ?? []} />}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
