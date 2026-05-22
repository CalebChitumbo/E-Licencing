import { Link } from "react-router-dom";

import { StatusBadge } from "../../components/StatusBadge";
import { Spinner } from "../../components/Spinner";
import { useApplications } from "../../lib/queries";
import { fmtDate, fmtMoney } from "../../lib/utils";

export function ApplicationsListPage() {
  const apps = useApplications();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">My Applications</h1>
        <Link to="/app/applications/new" className="btn-primary">+ New application</Link>
      </div>
      {apps.isLoading && <Spinner />}
      {!apps.isLoading && (apps.data?.results.length ?? 0) === 0 && (
        <p className="text-sm text-slate-500">You don't have any applications yet.</p>
      )}
      <div className="space-y-2">
        {apps.data?.results.map((a) => (
          <Link
            key={a.id}
            to={`/app/applications/${a.id}`}
            className="card flex items-center justify-between hover:bg-slate-50 p-5"
          >
            <div>
              <div className="font-semibold">
                {a.facility_snapshot?.name || a.facility_id} · {a.form_type}
              </div>
              <div className="text-xs text-slate-500">
                Submitted {fmtDate(a.submitted_at)} · {fmtMoney(a.fee_amount)} · Stage: {a.current_stage}
              </div>
            </div>
            <StatusBadge status={a.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
