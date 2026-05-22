import { useParams } from "react-router-dom";

import { Spinner } from "../../components/Spinner";
import { usePublicLicence } from "../../lib/queries";
import { fmtDate } from "../../lib/utils";

export function PublicVerifyPage() {
  const { licenceNumber } = useParams();
  const licence = usePublicLicence(licenceNumber);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-xl">
        <header className="mb-4 text-center">
          <h1 className="text-2xl font-semibold">Licence verification</h1>
          <p className="text-sm text-slate-600">
            Radiation Protection Authority of Zambia · Public verification portal
          </p>
        </header>
        <div className="card">
          <div className="card-body">
            {licence.isLoading && <Spinner />}
            {licence.isError && (
              <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                No licence found for the number <span className="font-mono">{licenceNumber}</span>.
                Please double-check the number printed on the certificate.
              </div>
            )}
            {licence.data && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase text-slate-500">Licence number</div>
                    <div className="font-mono text-base">{licence.data.licence_number}</div>
                  </div>
                  <span
                    className={
                      "badge " +
                      (licence.data.status === "active"
                        ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200"
                        : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200")
                    }
                  >
                    {licence.data.status}
                  </span>
                </div>
                <hr className="border-slate-200" />
                <div>
                  <div className="text-xs uppercase text-slate-500">Holder</div>
                  <div>{licence.data.holder_name}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Facility</div>
                  <div>{licence.data.facility_name}</div>
                  <div className="text-xs text-slate-500">
                    {licence.data.facility_district}, {licence.data.facility_province}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs uppercase text-slate-500">Issued</div>
                    <div>{fmtDate(licence.data.issued_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-500">Expires</div>
                    <div>{fmtDate(licence.data.expires_at)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          For questions about this licence, contact info@rpa.gov.zm.
        </p>
      </div>
    </div>
  );
}
