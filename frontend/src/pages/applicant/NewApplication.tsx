import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ErrorBox, Spinner } from "../../components/Spinner";
import { asApiError } from "../../lib/api";
import { useCreateApplication, useFacilities } from "../../lib/queries";

export function NewApplicationPage() {
  const facilities = useFacilities();
  const create = useCreateApplication();
  const navigate = useNavigate();
  const [facilityId, setFacilityId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!facilityId) return setError("Select a facility.");
    try {
      const app = await create.mutateAsync({ form_type: "FORM_I", facility_id: facilityId });
      navigate(`/app/applications/${app.id}`);
    } catch (err) {
      setError(asApiError(err).detail);
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-2xl">New Application — Form I (New Licence)</h1>
      <p className="text-slate-600 text-sm">
        Choose the facility this application is for. After creation you'll fill in the application
        wizard and upload supporting documents. Submitting will create an invoice for the prescribed fee.
      </p>
      {facilities.isLoading ? (
        <Spinner />
      ) : (facilities.data?.results.length ?? 0) === 0 ? (
        <ErrorBox>You need to add a facility first.</ErrorBox>
      ) : (
        <form onSubmit={onSubmit} className="card card-body space-y-4">
          {error && <ErrorBox>{error}</ErrorBox>}
          <div>
            <label className="label">Facility</label>
            <select className="input" value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)} required>
              <option value="">Select a facility…</option>
              {facilities.data?.results.map((f) => (
                <option key={f.id} value={f.id}>{f.name} — {f.district}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create draft"}
          </button>
        </form>
      )}
    </div>
  );
}
