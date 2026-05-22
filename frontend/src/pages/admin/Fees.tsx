import { useEffect, useState } from "react";

import { ErrorBox, Spinner } from "../../components/Spinner";
import { asApiError } from "../../lib/api";
import { useFeeSchedule, useSetFeeSchedule } from "../../lib/queries";

const FORMS = [
  ["FORM_I", "New Licence"],
  ["FORM_V", "Renewal of Licence"],
  ["FORM_VI", "Amendment of Licence"],
  ["FORM_VIII", "Transfer of Licence"],
  ["FORM_IX", "Authorisation of Activities"],
  ["FORM_XIII", "Authorisation of Practice"],
] as const;

export function AdminFeesPage() {
  const schedule = useFeeSchedule();
  const save = useSetFeeSchedule();
  const [fees, setFees] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (schedule.data) setFees(schedule.data.fees);
  }, [schedule.data]);

  async function onSave() {
    setError(null);
    setSavedMsg(null);
    try {
      await save.mutateAsync({ fees });
      setSavedMsg("Fee schedule updated.");
    } catch (err) {
      setError(asApiError(err).detail);
    }
  }

  if (schedule.isLoading) return <Spinner />;
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl">Fee schedule</h1>
      <p className="text-slate-600 text-sm">
        Amounts are in ZMW. Changes take effect for applications submitted after save.
      </p>
      {error && <ErrorBox>{error}</ErrorBox>}
      {savedMsg && <div className="rounded border border-green-200 bg-green-50 p-2 text-sm text-green-800">{savedMsg}</div>}
      <div className="card">
        <div className="card-body space-y-3">
          {FORMS.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-slate-500">{key}</div>
              </div>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input max-w-[150px] text-right"
                value={fees[key] ?? 0}
                onChange={(e) => setFees({ ...fees, [key]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
      </div>
      <button className="btn-primary" onClick={onSave} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
