import { ArrowRight, FilePlus, FileText } from "lucide-react";
import { Link } from "react-router-dom";

import { StageBadge, StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { useApplications } from "../../lib/queries";
import { fmtDate, fmtMoney } from "../../lib/utils";

export function ApplicationsListPage() {
  const apps = useApplications();
  const list = apps.data?.results || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My applications"
        description="Track status, respond to information requests, and download issued licences."
        actions={
          <Link to="/app/applications/new">
            <Button icon={<FilePlus className="h-4 w-4" />}>New application</Button>
          </Link>
        }
      />

      {apps.isLoading && (
        <div className="space-y-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}

      {!apps.isLoading && list.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="When you submit a Form I, it shows up here with live status updates."
          action={
            <Link to="/app/applications/new">
              <Button icon={<FilePlus className="h-4 w-4" />}>Start your first application</Button>
            </Link>
          }
        />
      )}

      <div className="space-y-3">
        {list.map((a) => (
          <Link key={a.id} to={`/app/applications/${a.id}`} className="block">
            <Card className="surface-hover">
              <CardBody className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-slate-900">
                      {a.facility_snapshot?.name || a.facility_id}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {a.form_type}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Submitted {fmtDate(a.submitted_at)} · Fee {fmtMoney(a.fee_amount)}
                  </div>
                  <div className="mt-2"><StageBadge stage={a.current_stage} /></div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} />
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
