import { useState } from "react";
import { Link } from "react-router-dom";

import { StatusBadge } from "../../components/StatusBadge";
import { Spinner } from "../../components/Spinner";
import { useInvoices } from "../../lib/queries";
import { fmtDate, fmtMoney } from "../../lib/utils";

export function InvoiceQueuePage() {
  const [scope, setScope] = useState<"pending" | "verified">("pending");
  const invoices = useInvoices(scope);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Accounts queue</h1>
        <div className="flex gap-1 text-sm">
          <button
            className={"px-3 py-1 rounded " + (scope === "pending" ? "bg-brand-500 text-white" : "bg-slate-100")}
            onClick={() => setScope("pending")}>Pending</button>
          <button
            className={"px-3 py-1 rounded " + (scope === "verified" ? "bg-brand-500 text-white" : "bg-slate-100")}
            onClick={() => setScope("verified")}>Verified</button>
        </div>
      </div>
      {invoices.isLoading && <Spinner />}
      {!invoices.isLoading && (invoices.data?.results.length ?? 0) === 0 && (
        <p className="text-sm text-slate-500">No invoices in this view.</p>
      )}
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Invoice</th>
              <th className="px-4 py-2">Application</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Issued</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.data?.results.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">
                  <Link to={`/accounts/invoices/${inv.id}`} className="text-brand-500 hover:underline">
                    {inv.id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{inv.application_id.slice(0, 8)}…</td>
                <td className="px-4 py-2">{fmtMoney(inv.total, inv.currency)}</td>
                <td className="px-4 py-2"><StatusBadge status={inv.status} /></td>
                <td className="px-4 py-2">{fmtDate(inv.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
