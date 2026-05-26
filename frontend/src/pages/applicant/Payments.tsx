import { ExternalLink, Receipt } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { StatusBadge } from "../../components/ui/Badge";
import { Card, CardBody } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { useInvoices } from "../../lib/queries";
import { cn, fmtDate, fmtMoney } from "../../lib/utils";

export function PaymentsPage() {
  const [params] = useSearchParams();
  const highlight = params.get("invoice");
  const invoices = useInvoices("mine");
  const list = invoices.data?.results || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="After submission an invoice is issued. Pay via mobile money or bank deposit, then the Accounts team verifies within 48 hours."
      />

      {invoices.isLoading && (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
      )}

      {!invoices.isLoading && list.length === 0 && (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="When you submit an application, the prescribed fee is invoiced here."
        />
      )}

      <div className="space-y-3">
        {list.map((inv) => (
          <Card key={inv.id} className={cn(inv.id === highlight && "ring-2 ring-brand-500 ring-offset-2")}>
            <CardBody className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Receipt className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-lg font-semibold text-slate-900">
                    {fmtMoney(inv.total, inv.currency)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Application {inv.application_id.slice(0, 8)}… · Issued {fmtDate(inv.created_at)}
                  </div>
                  {inv.payment_ref && (
                    <div className="text-xs text-slate-500">Payment ref: {inv.payment_ref}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={inv.status} />
                <Link to={`/app/applications/${inv.application_id}`}
                      className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline">
                  View application <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
