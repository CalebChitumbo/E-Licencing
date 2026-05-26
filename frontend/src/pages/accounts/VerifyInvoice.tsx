import { CheckCircle2, Receipt } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "../../components/ui/Alert";
import { StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { SkeletonText } from "../../components/ui/Skeleton";
import { toast } from "../../components/ui/Toaster";
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

  async function onVerify() {
    if (!ref.trim()) {
      toast.error("Payment reference is required.");
      return;
    }
    try {
      await verify.mutateAsync({ payment_ref: ref, notes });
      toast.success("Payment verified. Application released to NRSO.");
      navigate("/accounts/invoices");
    } catch (err) {
      toast.error(asApiError(err).detail);
    }
  }

  if (invoice.isLoading) return <SkeletonText lines={6} />;
  if (!invoice.data) return <Alert tone="error">Invoice not found.</Alert>;
  const inv = invoice.data;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Invoices", to: "/accounts/invoices" }, { label: inv.id.slice(0, 8) + "…" }]}
        title="Verify payment"
        description="Confirm the bank or mobile-money reference matches the proof uploaded by the applicant."
        actions={<StatusBadge status={inv.status} size="md" />}
      />

      <Card>
        <CardHeader eyebrow="Invoice details">Summary</CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Row k="Invoice"      v={<span className="font-mono">{inv.id}</span>} />
            <Row k="Application"  v={<span className="font-mono">{inv.application_id}</span>} />
            <Row k="Issued"       v={fmtDate(inv.created_at)} />
            <Row k="Total"        v={<span className="font-semibold">{fmtMoney(inv.total, inv.currency)}</span>} />
          </div>
          <div className="mt-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Line items</div>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {inv.line_items.map((li, i) => (
                <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-slate-400" />
                    <span>{li.description}</span>
                  </div>
                  <span className="tabular-nums">{fmtMoney(li.amount, inv.currency)} × {li.qty}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardBody>
      </Card>

      {inv.status === "pending" ? (
        <Card>
          <CardHeader>Verification</CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="label">Payment reference</label>
              <input className="input" value={ref} onChange={(e) => setRef(e.target.value)}
                     placeholder="MTN MoMo / Airtel Money / Bank reference" />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input min-h-[80px]" value={notes}
                        onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button variant="accent" icon={<CheckCircle2 className="h-4 w-4" />}
                      loading={verify.isPending} onClick={onVerify}>
                Verify payment & release to NRSO
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Alert tone="success" title="Already verified">
          Verified by <span className="font-mono">{inv.verified_by}</span> on {fmtDate(inv.verified_at)}
          {inv.payment_ref && <> · ref <span className="font-mono">{inv.payment_ref}</span></>}.
        </Alert>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{k}</div>
      <div className="mt-0.5">{v}</div>
    </div>
  );
}
