import { ArrowRight, Building2, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { Spinner } from "../../components/Spinner";
import { toast } from "../../components/ui/Toaster";
import { asApiError } from "../../lib/api";
import { useCreateApplication, useFacilities } from "../../lib/queries";

export function NewApplicationPage() {
  const facilities = useFacilities();
  const create = useCreateApplication();
  const navigate = useNavigate();
  const [facilityId, setFacilityId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const list = facilities.data?.results || [];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!facilityId) return setError("Select a facility.");
    try {
      const app = await create.mutateAsync({ form_type: "FORM_I", facility_id: facilityId });
      toast.success("Application draft created.");
      navigate(`/app/applications/${app.id}`);
    } catch (err) {
      setError(asApiError(err).detail);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="New application — Form I"
        description="Application for a new licence under the Ionising Radiation Protection Act."
        breadcrumbs={[{ label: "Applications", to: "/app/applications" }, { label: "New" }]}
      />

      <Card>
        <CardHeader eyebrow="Step 1 of 5">Choose the facility</CardHeader>
        <CardBody>
          {facilities.isLoading && <Spinner />}
          {!facilities.isLoading && list.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No facilities to apply for"
              description="Register a facility first, then come back to create an application."
              action={<Button onClick={() => navigate("/app/facilities")}>Add a facility</Button>}
            />
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <Alert tone="error">{error}</Alert>}
              <div>
                <label className="label">Facility</label>
                <select className="input" value={facilityId}
                        onChange={(e) => setFacilityId(e.target.value)} required>
                  <option value="">Select a facility…</option>
                  {list.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} — {f.district}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-slate-500" />
                  <div>
                    The application will be auto-filled from your facility record. After submission,
                    an invoice is generated and the application is queued for review by the
                    licensing team.
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={create.isPending}
                        iconRight={<ArrowRight className="h-4 w-4" />}>
                  Create draft
                </Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
