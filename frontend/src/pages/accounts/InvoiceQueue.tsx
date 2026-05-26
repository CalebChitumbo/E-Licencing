import { Inbox, Receipt, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { SkeletonRow } from "../../components/ui/Skeleton";
import { useInvoices } from "../../lib/queries";
import { cn, fmtDate, fmtMoney } from "../../lib/utils";

export function InvoiceQueuePage() {
  const [scope, setScope] = useState<"pending" | "verified">("pending");
  const [search, setSearch] = useState("");
  const invoices = useInvoices(scope);

  const items = useMemo(() => {
    const list = invoices.data?.results || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((i) => i.application_id.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  }, [invoices.data, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Verify proof-of-payment for new applications. Verifying releases the application to the licensing team."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex rounded-lg bg-slate-100 p-1">
            <Tab active={scope === "pending"} onClick={() => setScope("pending")}>Pending</Tab>
            <Tab active={scope === "verified"} onClick={() => setScope("verified")}>Verified</Tab>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9" placeholder="Search by invoice or application id…"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="ml-auto text-xs text-slate-500">{items.length} invoice{items.length === 1 ? "" : "s"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Application</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.isLoading &&
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
              {!invoices.isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10">
                    <EmptyState
                      icon={scope === "pending" ? Inbox : Receipt}
                      title={scope === "pending" ? "Nothing to verify" : "No verified invoices in view"}
                      description={scope === "pending"
                        ? "When applicants upload proof of payment, those invoices appear here."
                        : "Switch to Pending to verify newly submitted payments."}
                    />
                  </td>
                </tr>
              )}
              {items.map((inv) => (
                <tr key={inv.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{inv.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-mono text-xs">{inv.application_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(inv.total, inv.currency)}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-slate-600">{fmtDate(inv.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/accounts/invoices/${inv.id}`}>
                      <Button size="sm" variant="outline">Open</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Tab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1 text-sm font-medium transition",
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  );
}
