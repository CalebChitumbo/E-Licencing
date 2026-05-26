import {
  ArrowRight,
  Building2,
  FilePlus,
  FileText,
  Receipt,
} from "lucide-react";
import { Link } from "react-router-dom";

import { StatusBadge } from "../../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton, SkeletonText } from "../../components/ui/Skeleton";
import { Stat } from "../../components/ui/Stat";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../lib/auth";
import { useApplications, useFacilities, useInvoices } from "../../lib/queries";
import { fmtDate, fmtMoney } from "../../lib/utils";

export function ApplicantDashboardPage() {
  const { profile } = useAuth();
  const apps = useApplications();
  const facilities = useFacilities();
  const invoices = useInvoices("mine");

  const appList = apps.data?.results || [];
  const facList = facilities.data?.results || [];
  const pendingInvoices = (invoices.data?.results || []).filter((i) => i.status === "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile?.display_name || "Applicant"}`}
        description="Submit, track, and manage radiation licence applications with the Authority."
        actions={
          <Link to="/app/applications/new">
            <Button icon={<FilePlus className="h-4 w-4" />}>New application</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Facilities" icon={Building2} tone="blue"
              value={facList.length}
              loading={facilities.isLoading}
              cta={{ label: "Manage facilities", to: "/app/facilities" }} />
        <Stat label="Applications" icon={FileText} tone="violet"
              value={appList.length}
              loading={apps.isLoading}
              cta={{ label: "View all", to: "/app/applications" }} />
        <Stat label="Pending invoices" icon={Receipt} tone="amber"
              value={pendingInvoices.length}
              loading={invoices.isLoading}
              cta={{ label: "Pay or upload proof", to: "/app/payments" }} />
      </div>

      <Card>
        <CardHeader
          actions={
            <Link to="/app/applications" className="text-sm text-brand-500 hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          Recent applications
        </CardHeader>
        <CardBody>
          {apps.isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <SkeletonText lines={2} className="flex-1" />
                  <Skeleton className="ml-4 h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          )}
          {!apps.isLoading && appList.length === 0 && (
            <EmptyState
              icon={FileText}
              title="No applications yet"
              description="Start your first licence application — it takes a few minutes."
              action={
                <Link to="/app/applications/new">
                  <Button icon={<FilePlus className="h-4 w-4" />}>Start application</Button>
                </Link>
              }
            />
          )}
          <div className="divide-y divide-slate-100">
            {appList.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                to={`/app/applications/${a.id}`}
                className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900">
                    {a.facility_snapshot?.name || a.facility_id}
                    <span className="ml-2 text-xs font-normal text-slate-500">{a.form_type}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Updated {fmtDate(a.updated_at)} · {fmtMoney(a.fee_amount)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} />
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
