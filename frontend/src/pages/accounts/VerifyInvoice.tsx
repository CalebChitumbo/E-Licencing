import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorBox, Spinner } from "../../components/Spinner";
import { StatusBadge } from "../../components/StatusBadge";
import { asApiError } from "../../lib/api";
import { useInvoice, useVerifyInvoice } from "../../lib/queries";
import { fmtDate, fmtMoney } from "../../lib/utils";

export function VerifyInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoice = useInvoice(id);
  const verify = useVerifyInvoice(id || "");
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onVerify() {
    setError(null);
    if (!ref.trim()) return setError("Payment reference is required.");
    try {
      await verify.mutateAsync({ payment_ref: ref, notes });
      navigate("/accounts/invoices");
    } catch (err) {
      setError(asApiError(err).detail);
    }
  }

  if (invoice.isLoading) return <Spinner />;
  if (!invoice.data) return <ErrorBox>Invoice not found.</ErrorBox>;
  const inv = invoice.data;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl">Verify payment</h1>
      <div className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div><span className="text-slate-500">Invoice:</span> <span className="font-mono">{inv.id}</span></div>
          <div><span className="text-slate-500">Application:</span> <span className="font-mono">{inv.application_id}</span></div>
          <div><span className="text-slate-500">Total:</span> {fmtMoney(inv.total, inv.currency)}</div>
          <div><span className="text-slate-500">Issued:</span> {fmtDate(inv.created_at)}</div>
          <div className="md:col-span-2">
            <span className="text-slate-500">Status:</span> <StatusBadge status={inv.status} />
          </div>
          <div className="md:col-span-2">
            <span className="text-slate-500">Line items:</span>
            <ul className="mt-1 list-disc pl-5">
              {inv.line_items.map((li, i) => (
                <li key={i}>{li.description} — {fmtMoney(li.amount, inv.currency)} × {li.qty}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {inv.status === "pending" ? (
        <div className="card">
          <div className="card-header">Verification</div>
          <div className="card-body space-y-3">
            {error && <ErrorBox>{error}</ErrorBox>}
            <div>
              <label className="label">Payment reference (MM ref / bank ref)</label>
              <input className="input" value={ref} onChange={(e) => setRef(e.target.value)} />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input min-h-[80px]" value={notes}
                        onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button onClick={onVerify} className="btn-accent" disabled={verify.isPending}>
              {verify.isPending ? "Verifying…" : "Verify payment & release to NRSO"}
            </button>
          </div>
        </div>
      ) : (
        <div className="card card-body">
          <div className="text-sm">
            Verified by <span className="font-mono">{inv.verified_by}</span> on {fmtDate(inv.verified_at)} ·
            ref {inv.payment_ref}.
          </div>
        </div>
      )}
    </div>
  );
}
