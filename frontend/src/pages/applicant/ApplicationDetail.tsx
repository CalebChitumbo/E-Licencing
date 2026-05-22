import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AuditTimeline } from "../../components/AuditTimeline";
import { ErrorBox, Spinner } from "../../components/Spinner";
import { StageBadge, StatusBadge } from "../../components/StatusBadge";
import { asApiError } from "../../lib/api";
import {
  useApplication,
  useApplicationAudit,
  useSubmitApplication,
  useUpdateWizard,
} from "../../lib/queries";
import { fmtDate, fmtMoney } from "../../lib/utils";

const WIZARD_STEPS = [
  { step: 1, title: "Applicant & contact", fields: ["applicant_name", "contact_phone", "contact_email"] },
  { step: 2, title: "Practice description", fields: ["practice_type", "workload_summary", "personnel_count"] },
  { step: 3, title: "Source declaration", fields: ["source_summary", "shielding_summary"] },
  { step: 4, title: "Safety & training", fields: ["training_records", "dosimetry_provider", "emergency_plan_summary"] },
] as const;

export function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const app = useApplication(id);
  const audit = useApplicationAudit(id);
  const submit = useSubmitApplication(id || "");
  const updateWizard = useUpdateWizard(id || "");

  const [step, setStep] = useState(1);
  const [stepData, setStepData] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  if (app.isLoading) return <Spinner />;
  if (!app.data) return <ErrorBox>Application not found.</ErrorBox>;

  const a = app.data;
  const editable = a.current_stage === "draft" || a.current_stage === "info_requested";

  const saved = (a.wizard_data?.[`step_${step}`] as Record<string, string> | undefined) || {};
  const currentStep = WIZARD_STEPS.find((s) => s.step === step)!;

  async function onSaveStep() {
    setError(null);
    try {
      await updateWizard.mutateAsync({ step, data: { ...saved, ...stepData } });
      setStepData({});
    } catch (err) {
      setError(asApiError(err).detail);
    }
  }

  async function onSubmit() {
    setError(null);
    try {
      const result = await submit.mutateAsync();
      navigate(`/app/payments?invoice=${result.invoice_id}`);
    } catch (err) {
      setError(asApiError(err).detail);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="card">
          <div className="card-body flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">{a.form_type} application</div>
              <div className="text-xl font-semibold">
                {a.facility_snapshot?.name || a.facility_id}
              </div>
              <div className="text-xs text-slate-500">
                Created {fmtDate(a.created_at)} · Fee {fmtMoney(a.fee_amount)}
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <StatusBadge status={a.status} />
              <StageBadge stage={a.current_stage} />
            </div>
          </div>
        </div>

        {a.info_request?.reason && (
          <ErrorBox>
            <div className="font-semibold">Information requested</div>
            <div className="text-sm">{a.info_request.reason}</div>
          </ErrorBox>
        )}

        {editable && (
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <span>Application wizard</span>
              <div className="flex gap-1">
                {WIZARD_STEPS.map((s) => (
                  <button key={s.step}
                          onClick={() => { setStep(s.step); setStepData({}); }}
                          className={
                            "rounded px-2 py-1 text-xs " +
                            (step === s.step ? "bg-brand-500 text-white" : "bg-slate-100")
                          }>
                    {s.step}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-body space-y-3">
              <div className="font-medium">Step {step}: {currentStep.title}</div>
              {error && <ErrorBox>{error}</ErrorBox>}
              {currentStep.fields.map((f) => (
                <div key={f}>
                  <label className="label">{f.replace(/_/g, " ")}</label>
                  <input className="input"
                         defaultValue={(saved[f] as string) || ""}
                         onBlur={(e) => setStepData((prev) => ({ ...prev, [f]: e.target.value }))} />
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <button className="btn-ghost" type="button"
                        disabled={step === 1}
                        onClick={() => setStep((s) => Math.max(1, s - 1))}>
                  ← Previous
                </button>
                <button className="btn-outline" onClick={onSaveStep} disabled={updateWizard.isPending}>
                  Save step
                </button>
                {step < WIZARD_STEPS.length ? (
                  <button className="btn-primary" type="button"
                          onClick={() => setStep((s) => s + 1)}>
                    Next →
                  </button>
                ) : (
                  <button className="btn-accent" type="button"
                          onClick={onSubmit} disabled={submit.isPending}>
                    {submit.isPending ? "Submitting…" : "Submit application"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!editable && (
          <div className="card">
            <div className="card-header">Submitted wizard data</div>
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
        )}

        {a.licence_id && (
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-slate-500">Licence issued</div>
              <div className="text-xl font-semibold">{a.licence_id}</div>
              <a
                href={`${import.meta.env.VITE_PUBLIC_VERIFY_URL || "/verify"}/${a.licence_id}`}
                className="text-sm text-brand-500 hover:underline"
                target="_blank" rel="noreferrer"
              >
                Public verification →
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
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
