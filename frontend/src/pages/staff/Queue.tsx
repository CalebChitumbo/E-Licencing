import { useState } from "react";
import { Link } from "react-router-dom";

import { StageBadge, StatusBadge } from "../../components/StatusBadge";
import { Spinner } from "../../components/Spinner";
import { useQueue } from "../../lib/queries";
import { fmtDate, fmtMoney } from "../../lib/utils";

export function StaffQueuePage() {
  const [mine, setMine] = useState(false);
  const queue = useQueue(mine);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Application Queue</h1>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
          Only assigned to me
        </label>
      </div>
      {queue.isLoading && <Spinner />}
      {!queue.isLoading && (queue.data?.results.length ?? 0) === 0 && (
        <p className="text-sm text-slate-500">Nothing in your queue.</p>
      )}
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Application</th>
              <th className="px-4 py-2">Facility</th>
              <th className="px-4 py-2">Stage</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Submitted</th>
              <th className="px-4 py-2">Fee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {queue.data?.results.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">
                  <Link to={`/staff/applications/${a.id}`} className="text-brand-500 hover:underline">
                    {a.id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-2">{a.facility_snapshot?.name || a.facility_id}</td>
                <td className="px-4 py-2"><StageBadge stage={a.current_stage} /></td>
                <td className="px-4 py-2"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-2">{fmtDate(a.submitted_at)}</td>
                <td className="px-4 py-2">{fmtMoney(a.fee_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
