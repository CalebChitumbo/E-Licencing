import { Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { SkeletonText } from "../../components/ui/Skeleton";
import { toast } from "../../components/ui/Toaster";
import { asApiError } from "../../lib/api";
import { useFeeSchedule, useSetFeeSchedule } from "../../lib/queries";

const FORMS = [
  ["FORM_I",   "New Licence"],
  ["FORM_V",   "Renewal of Licence"],
  ["FORM_VI",  "Amendment of Licence"],
  ["FORM_VIII","Transfer of Licence"],
  ["FORM_IX",  "Authorisation of Activities"],
  ["FORM_XIII","Authorisation of Practice"],
] as const;

export function AdminFeesPage() {
  const schedule = useFeeSchedule();
  const save = useSetFeeSchedule();
  const [fees, setFees] = useState<Record<string, number>>({});

  useEffect(() => { if (schedule.data) setFees(schedule.data.fees); }, [schedule.data]);

  async function onSave() {
    try {
      await save.mutateAsync({ fees });
      toast.success("Fee schedule updated.");
    } catch (err) {
      toast.error(asApiError(err).detail);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Fee schedule"
                  description="Amounts in ZMW. Changes apply to applications submitted after save."
                  actions={
                    <Button icon={<Save className="h-4 w-4" />} loading={save.isPending} onClick={onSave}>
                      Save changes
                    </Button>
                  } />
      {schedule.isLoading ? (
        <SkeletonText lines={6} />
      ) : (
        <Card>
          <CardHeader>Per-form fees</CardHeader>
          <CardBody>
            <div className="divide-y divide-slate-100">
              {FORMS.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{label}</div>
                    <div className="text-xs text-slate-500">{key}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">ZMW</span>
                    <input
                      type="number" min={0} step="0.01"
                      className="input max-w-[160px] text-right tabular-nums"
                      value={fees[key] ?? 0}
                      onChange={(e) => setFees({ ...fees, [key]: Number(e.target.value) })}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Alert tone="info" className="mt-4">
              These fees are read by the application-submission flow. Existing invoices are unaffected.
            </Alert>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
