import { Building2, CalendarCheck, CircleDot, FileSignature, ShieldAlert, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";

import { Alert } from "../../components/ui/Alert";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { SkeletonText } from "../../components/ui/Skeleton";
import { usePublicLicence } from "../../lib/queries";
import { fmtDate } from "../../lib/utils";

export function PublicVerifyPage() {
  const { licenceNumber } = useParams();
  const licence = usePublicLicence(licenceNumber);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500 text-yellow-300 shadow">
            <CircleDot className="h-6 w-6" />
          </span>
          <div>
            <div className="text-base font-semibold text-slate-900">Licence verification</div>
            <div className="text-xs text-slate-500">Radiation Protection Authority of Zambia</div>
          </div>
        </div>

        <Card>
          <CardHeader eyebrow="Public verification">
            Licence {licenceNumber}
          </CardHeader>
          <CardBody>
            {licence.isLoading && <SkeletonText lines={5} />}

            {licence.isError && (
              <Alert tone="error" title="Licence not found">
                We could not find a licence matching <span className="font-mono">{licenceNumber}</span>.
                Please check the number printed on the certificate.
              </Alert>
            )}

            {licence.data && (
              <div className="space-y-4">
                <div className={
                  "flex items-center gap-3 rounded-xl p-4 ring-1 " +
                  (licence.data.status === "active"
                    ? "bg-green-50 text-green-800 ring-green-200"
                    : "bg-red-50 text-red-800 ring-red-200")
                }>
                  {licence.data.status === "active"
                    ? <ShieldCheck className="h-6 w-6" />
                    : <ShieldAlert className="h-6 w-6" />}
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-wider">
                      {licence.data.status}
                    </div>
                    <div className="text-xs opacity-80">
                      {licence.data.status === "active"
                        ? "This licence is currently valid."
                        : "This licence is not currently valid."}
                    </div>
                  </div>
                </div>

                <Row icon={<FileSignature className="h-4 w-4" />} label="Licence holder">
                  {licence.data.holder_name}
                </Row>
                <Row icon={<Building2 className="h-4 w-4" />} label="Facility">
                  {licence.data.facility_name}
                  <div className="text-xs text-slate-500">
                    {licence.data.facility_district}, {licence.data.facility_province}
                  </div>
                </Row>
                <div className="grid grid-cols-2 gap-3">
                  <Row icon={<CalendarCheck className="h-4 w-4" />} label="Issued">
                    {fmtDate(licence.data.issued_at)}
                  </Row>
                  <Row icon={<CalendarCheck className="h-4 w-4" />} label="Expires">
                    {fmtDate(licence.data.expires_at)}
                  </Row>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-500">
          For questions about this licence, contact <a className="underline" href="mailto:info@rpa.gov.zm">info@rpa.gov.zm</a>.
        </p>
      </div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
        {icon}{label}
      </div>
      <div className="text-sm text-slate-900">{children}</div>
    </div>
  );
}
