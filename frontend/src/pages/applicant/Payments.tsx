import { Link, useSearchParams } from "react-router-dom";

import { StatusBadge } from "../../components/StatusBadge";
import { Spinner } from "../../components/Spinner";
import { useInvoices } from "../../lib/queries";
import { fmtDate, fmtMoney } from "../../lib/utils";

export function PaymentsPage() {
  const [params] = useSearchParams();
  const highlight = params.get("invoice");
  const invoices = useInvoices("mine");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl">Payments</h1>
      <p className="text-slate-600 text-sm">
        After submitting an application, an invoice is issued. Pay via mobile money or bank deposit
        and upload your proof of payment. The Accounts team will verify it within 48 hours.
      </p>
      {invoices.isLoading && <Spinner />}
      {!invoices.isLoading && (invoices.data?.results.length ?? 0) === 0 && (
        <p className="text-sm text-slate-500">No invoices yet.</p>
      )}
      <div className="space-y-2">
        {invoices.data?.results.map((inv) => (
          <div
            key={inv.id}
            className={"card card-body flex items-center justify-between " +
              (inv.id === highlight ? "ring-2 ring-brand-500" : "")}
          >
            <div>
              <div className="font-semibold">{fmtMoney(inv.total, inv.currency)}</div>
              <div className="text-xs text-slate-500">
                Invoice for application {inv.application_id} · Issued {fmtDate(inv.created_at)}
              </div>
              {inv.payment_ref && (
                <div className="text-xs text-slate-500">
                  Payment ref: {inv.payment_ref}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={inv.status} />
              <Link to={`/app/applications/${inv.application_id}`}
                    className="text-xs text-brand-500 hover:underline">
                View application →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
