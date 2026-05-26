import { Inbox, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { StageBadge, StatusBadge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { SkeletonRow } from "../../components/ui/Skeleton";
import { useQueue } from "../../lib/queries";
import { fmtDate, fmtMoney } from "../../lib/utils";

export function StaffQueuePage() {
  const [mine, setMine] = useState(false);
  const [search, setSearch] = useState("");
  const queue = useQueue(mine);

  const items = useMemo(() => {
    const list = queue.data?.results || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((a) =>
      (a.facility_snapshot?.name || "").toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q),
    );
  }, [queue.data, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application queue"
        description="Applications awaiting your action."
        actions={
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={mine}
              onChange={(e) => setMine(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
            />
            Only assigned to me
          </label>
        }
      />

      <Card>
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search facility name or application id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs text-slate-500">{items.length} item{items.length === 1 ? "" : "s"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Application</th>
                <th className="px-4 py-3">Facility</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.isLoading &&
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
              {!queue.isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10">
                    <EmptyState icon={Inbox} title="Inbox zero"
                                description="Nothing matches your filters. Try clearing the search or the 'assigned to me' toggle." />
                  </td>
                </tr>
              )}
              {items.map((a) => (
                <tr key={a.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to={`/staff/applications/${a.id}`} className="text-brand-500 hover:underline">
                      {a.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{a.facility_snapshot?.name || a.facility_id}</div>
                    <div className="text-xs text-slate-500">{a.facility_snapshot?.district || "—"}</div>
                  </td>
                  <td className="px-4 py-3"><StageBadge stage={a.current_stage} /></td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-slate-600">{fmtDate(a.submitted_at)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(a.fee_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
