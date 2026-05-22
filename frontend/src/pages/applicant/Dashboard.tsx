import { Link } from "react-router-dom";

import { StatusBadge } from "../../components/StatusBadge";
import { Spinner } from "../../components/Spinner";
import { useAuth } from "../../lib/auth";
import { useApplications, useFacilities, useInvoices } from "../../lib/queries";
import { fmtDate, fmtMoney } from "../../lib/utils";

export function ApplicantDashboardPage() {
  const { profile } = useAuth();
  const apps = useApplications();
  const facilities = useFacilities();
  const invoices = useInvoices("mine");

  const pendingInvoices = (invoices.data?.results || []).filter((i) => i.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Welcome, {profile?.display_name || "Applicant"}</h1>
        <p className="text-slate-600">
          Submit, track, and manage your radiation licence applications with the Authority.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <div className="text-slate-500 text-sm">Facilities</div>
            <div className="text-3xl font-semibold">
              {facilities.isLoading ? "…" : facilities.data?.results.length ?? 0}
            </div>
            <Link to="/app/facilities" className="text-sm text-brand-500 hover:underline">
              Manage facilities →
            </Link>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-slate-500 text-sm">Applications</div>
            <div className="text-3xl font-semibold">
              {apps.isLoading ? "…" : apps.data?.results.length ?? 0}
            </div>
            <Link to="/app/applications" className="text-sm text-brand-500 hover:underline">
              View all →
            </Link>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-slate-500 text-sm">Pending invoices</div>
            <div className="text-3xl font-semibold">
              {invoices.isLoading ? "…" : pendingInvoices.length}
            </div>
            <Link to="/app/payments" className="text-sm text-brand-500 hover:underline">
              Pay or upload proof →
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span>Recent applications</span>
          <Link to="/app/applications/new" className="btn-primary text-xs">
            + New application
          </Link>
        </div>
        <div className="card-body">
          {apps.isLoading && <Spinner />}
          {!apps.isLoading && (apps.data?.results.length ?? 0) === 0 && (
            <p className="text-sm text-slate-500">No applications yet.</p>
          )}
          <div className="divide-y divide-slate-100">
            {apps.data?.results.slice(0, 5).map((a) => (
              <Link key={a.id} to={`/app/applications/${a.id}`}
                    className="flex items-center justify-between py-3 hover:bg-slate-50">
                <div>
                  <div className="font-medium">
                    {a.facility_snapshot?.name || a.facility_id} · {a.form_type}
                  </div>
                  <div className="text-xs text-slate-500">
                    Updated {fmtDate(a.updated_at)} · {fmtMoney(a.fee_amount)}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
