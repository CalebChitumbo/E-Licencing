import { useState } from "react";

import { ErrorBox, Spinner } from "../../components/Spinner";
import { asApiError } from "../../lib/api";
import { useAddSource, useCreateFacility, useFacilities, useSources } from "../../lib/queries";
import type { Facility } from "../../lib/types";

const FACILITY_TYPES = [
  "medical", "industrial", "research", "educational", "veterinary", "transport", "other",
] as const;

const SOURCE_TYPES = [
  "xray_machine", "sealed_source", "unsealed_source", "linear_accelerator",
  "ct_scanner", "fluoroscopy", "mammography", "dental_xray", "veterinary_xray",
  "industrial_radiography", "well_logging", "gauges", "other",
];

export function FacilitiesPage() {
  const facilities = useFacilities();
  const createFacility = useCreateFacility();
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Facilities</h1>
        <button onClick={() => setCreating((v) => !v)} className="btn-primary">
          {creating ? "Cancel" : "+ Add facility"}
        </button>
      </div>

      {creating && (
        <FacilityForm
          onCancel={() => setCreating(false)}
          onSubmit={async (body) => {
            await createFacility.mutateAsync(body);
            setCreating(false);
          }}
          submitting={createFacility.isPending}
          error={createFacility.error ? asApiError(createFacility.error).detail : null}
        />
      )}

      {facilities.isLoading && <Spinner />}
      {!facilities.isLoading && (facilities.data?.results.length ?? 0) === 0 && (
        <p className="text-sm text-slate-500">No facilities yet.</p>
      )}
      <div className="space-y-3">
        {facilities.data?.results.map((f) => (
          <div key={f.id} className="card">
            <div className="card-body flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{f.name}</div>
                <div className="text-xs text-slate-500">
                  {f.type} · {f.district || "—"}, {f.province || "—"} · PACRA: {f.pacra_number || "—"}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  RPO: {f.rpo?.name || "—"} ({f.rpo?.phone || "—"})
                </div>
              </div>
              <button className="btn-outline text-xs"
                      onClick={() => setExpanded((cur) => (cur === f.id ? null : f.id))}>
                {expanded === f.id ? "Hide sources" : "Sources"}
              </button>
            </div>
            {expanded === f.id && <SourcesPanel facilityId={f.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function SourcesPanel({ facilityId }: { facilityId: string }) {
  const sources = useSources(facilityId);
  const add = useAddSource(facilityId);
  const [form, setForm] = useState({ type: "xray_machine", make: "", model: "", serial: "" });

  return (
    <div className="border-t border-slate-100 p-5 space-y-3">
      <div className="font-medium">Radiation sources</div>
      {sources.isLoading && <Spinner />}
      {!sources.isLoading && (sources.data?.results.length ?? 0) === 0 && (
        <p className="text-sm text-slate-500">No sources yet.</p>
      )}
      <ul className="text-sm divide-y divide-slate-100">
        {sources.data?.results.map((s) => (
          <li key={s.id} className="py-2 flex justify-between">
            <span>{s.type} · {s.make} {s.model} · {s.serial || "no serial"}</span>
            <span className="text-xs text-slate-500">{s.status}</span>
          </li>
        ))}
      </ul>
      <form
        className="grid grid-cols-1 md:grid-cols-5 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate(form, { onSuccess: () => setForm({ type: "xray_machine", make: "", model: "", serial: "" }) });
        }}>
        <select className="input" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {SOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className="input" placeholder="Make" value={form.make}
               onChange={(e) => setForm({ ...form, make: e.target.value })} />
        <input className="input" placeholder="Model" value={form.model}
               onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <input className="input" placeholder="Serial" value={form.serial}
               onChange={(e) => setForm({ ...form, serial: e.target.value })} />
        <button className="btn-accent" type="submit" disabled={add.isPending}>Add source</button>
      </form>
    </div>
  );
}

type NewFacility = Partial<Facility>;

function FacilityForm({
  onSubmit, onCancel, submitting, error,
}: {
  onSubmit: (body: NewFacility) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<NewFacility>({
    name: "", type: "medical", legal_rep: { name: "", phone: "", email: "" },
    pacra_number: "", gov_entity: false,
    rpo: { name: "", phone: "", qualifications: "" },
    address: "", province: "", district: "",
  });

  function up<K extends keyof NewFacility>(key: K, value: NewFacility[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="card">
      <div className="card-header">New facility</div>
      <form
        className="card-body grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={async (e) => { e.preventDefault(); await onSubmit(form); }}
      >
        {error && <div className="md:col-span-2"><ErrorBox>{error}</ErrorBox></div>}
        <div>
          <label className="label">Facility name</label>
          <input className="input" required value={form.name ?? ""}
                 onChange={(e) => up("name", e.target.value)} />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type ?? "medical"}
                  onChange={(e) => up("type", e.target.value as Facility["type"])}>
            {FACILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">PACRA number</label>
          <input className="input" value={form.pacra_number ?? ""}
                 onChange={(e) => up("pacra_number", e.target.value)} />
        </div>
        <div>
          <label className="label">Province</label>
          <input className="input" value={form.province ?? ""}
                 onChange={(e) => up("province", e.target.value)} />
        </div>
        <div>
          <label className="label">District</label>
          <input className="input" value={form.district ?? ""}
                 onChange={(e) => up("district", e.target.value)} />
        </div>
        <div>
          <label className="label">Physical address</label>
          <input className="input" value={form.address ?? ""}
                 onChange={(e) => up("address", e.target.value)} />
        </div>
        <fieldset className="md:col-span-2 border-t border-slate-200 pt-3">
          <legend className="text-sm font-semibold text-slate-700">Radiation Protection Officer</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <input className="input" placeholder="Name" required value={form.rpo?.name ?? ""}
                   onChange={(e) => up("rpo", { ...(form.rpo as Facility["rpo"])!, name: e.target.value })} />
            <input className="input" placeholder="Phone" required value={form.rpo?.phone ?? ""}
                   onChange={(e) => up("rpo", { ...(form.rpo as Facility["rpo"])!, phone: e.target.value })} />
            <input className="input" placeholder="Qualifications" value={form.rpo?.qualifications ?? ""}
                   onChange={(e) => up("rpo", { ...(form.rpo as Facility["rpo"])!, qualifications: e.target.value })} />
          </div>
        </fieldset>
        <fieldset className="md:col-span-2 border-t border-slate-200 pt-3">
          <legend className="text-sm font-semibold text-slate-700">Legal representative</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <input className="input" placeholder="Name" value={form.legal_rep?.name ?? ""}
                   onChange={(e) => up("legal_rep", { ...form.legal_rep, name: e.target.value })} />
            <input className="input" placeholder="Phone" value={form.legal_rep?.phone ?? ""}
                   onChange={(e) => up("legal_rep", { ...form.legal_rep, phone: e.target.value })} />
            <input className="input" placeholder="Email" type="email" value={form.legal_rep?.email ?? ""}
                   onChange={(e) => up("legal_rep", { ...form.legal_rep, email: e.target.value })} />
          </div>
        </fieldset>
        <div className="md:col-span-2 flex items-center justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save facility"}
          </button>
        </div>
      </form>
    </div>
  );
}
