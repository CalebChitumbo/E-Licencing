import { Building2, ChevronDown, ChevronUp, Plus, Radio } from "lucide-react";
import { useState } from "react";

import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { Spinner } from "../../components/Spinner";
import { toast } from "../../components/ui/Toaster";
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

  const list = facilities.data?.results || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facilities"
        description="Each facility you operate must be registered separately. Sources, workers, and licences attach to a facility."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            Add facility
          </Button>
        }
      />

      {facilities.isLoading && (
        <div className="grid gap-3 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!facilities.isLoading && list.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No facilities registered"
          description="Add your first facility to start submitting licence applications."
          action={
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
              Add facility
            </Button>
          }
        />
      )}

      <div className="space-y-3">
        {list.map((f) => (
          <Card key={f.id} className="surface-hover">
            <CardBody className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold text-slate-900">{f.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge tone="blue" size="sm">{f.type}</Badge>
                    <span>{f.district || "—"}, {f.province || "—"}</span>
                    {f.pacra_number && <span>· PACRA {f.pacra_number}</span>}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    RPO: {f.rpo?.name || "—"} <span className="text-slate-400">({f.rpo?.phone || "—"})</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline" size="sm"
                icon={expanded === f.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                onClick={() => setExpanded((cur) => (cur === f.id ? null : f.id))}
              >
                Sources
              </Button>
            </CardBody>
            {expanded === f.id && <SourcesPanel facilityId={f.id} />}
          </Card>
        ))}
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Add facility"
        description="Provide the basic registration details. You can edit later."
        size="lg"
      >
        <FacilityForm
          onCancel={() => setCreating(false)}
          submitting={createFacility.isPending}
          onSubmit={async (body) => {
            try {
              await createFacility.mutateAsync(body);
              toast.success("Facility added.");
              setCreating(false);
            } catch (err) {
              toast.error(asApiError(err).detail);
            }
          }}
        />
      </Modal>
    </div>
  );
}

function SourcesPanel({ facilityId }: { facilityId: string }) {
  const sources = useSources(facilityId);
  const add = useAddSource(facilityId);
  const [form, setForm] = useState({ type: "xray_machine", make: "", model: "", serial: "" });

  return (
    <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
      <div className="flex items-center gap-2 font-medium text-slate-900">
        <Radio className="h-4 w-4 text-violet-600" />
        Radiation sources
      </div>
      {sources.isLoading && <Spinner />}
      {!sources.isLoading && (sources.data?.results.length ?? 0) === 0 && (
        <p className="text-sm text-slate-500">No sources yet.</p>
      )}
      <ul className="text-sm divide-y divide-slate-200">
        {sources.data?.results.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">{s.type.replace(/_/g, " ")}</div>
              <div className="text-xs text-slate-500">
                {s.make} {s.model} {s.serial && `· S/N ${s.serial}`}
              </div>
            </div>
            <Badge tone={s.status === "active" ? "green" : "gray"}>{s.status}</Badge>
          </li>
        ))}
      </ul>
      <form
        className="grid grid-cols-1 gap-2 md:grid-cols-5"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await add.mutateAsync(form);
            toast.success("Source added.");
            setForm({ type: "xray_machine", make: "", model: "", serial: "" });
          } catch (err) {
            toast.error(asApiError(err).detail);
          }
        }}
      >
        <select className="input" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {SOURCE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
        <input className="input" placeholder="Make" value={form.make}
               onChange={(e) => setForm({ ...form, make: e.target.value })} />
        <input className="input" placeholder="Model" value={form.model}
               onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <input className="input" placeholder="Serial" value={form.serial}
               onChange={(e) => setForm({ ...form, serial: e.target.value })} />
        <Button type="submit" variant="accent" loading={add.isPending} icon={<Plus className="h-4 w-4" />}>
          Add source
        </Button>
      </form>
    </div>
  );
}

type NewFacility = Partial<Facility>;

function FacilityForm({ onSubmit, onCancel, submitting }: {
  onSubmit: (body: NewFacility) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<NewFacility>({
    name: "", type: "medical", legal_rep: { name: "", phone: "", email: "" },
    pacra_number: "", gov_entity: false,
    rpo: { name: "", phone: "", qualifications: "" },
    address: "", province: "", district: "",
  });
  const [error, setError] = useState<string | null>(null);

  function up<K extends keyof NewFacility>(key: K, value: NewFacility[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        try { await onSubmit(form); } catch (err) { setError(String(err)); }
      }}
    >
      {error && <div className="md:col-span-2"><Alert tone="error">{error}</Alert></div>}
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
        <legend className="px-1 text-sm font-semibold text-slate-700">Radiation Protection Officer</legend>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
          <input className="input" placeholder="Name" required value={form.rpo?.name ?? ""}
                 onChange={(e) => up("rpo", { ...(form.rpo as Facility["rpo"])!, name: e.target.value })} />
          <input className="input" placeholder="Phone" required value={form.rpo?.phone ?? ""}
                 onChange={(e) => up("rpo", { ...(form.rpo as Facility["rpo"])!, phone: e.target.value })} />
          <input className="input" placeholder="Qualifications" value={form.rpo?.qualifications ?? ""}
                 onChange={(e) => up("rpo", { ...(form.rpo as Facility["rpo"])!, qualifications: e.target.value })} />
        </div>
      </fieldset>
      <fieldset className="md:col-span-2 border-t border-slate-200 pt-3">
        <legend className="px-1 text-sm font-semibold text-slate-700">Legal representative</legend>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
          <input className="input" placeholder="Name" value={form.legal_rep?.name ?? ""}
                 onChange={(e) => up("legal_rep", { ...form.legal_rep, name: e.target.value })} />
          <input className="input" placeholder="Phone" value={form.legal_rep?.phone ?? ""}
                 onChange={(e) => up("legal_rep", { ...form.legal_rep, phone: e.target.value })} />
          <input className="input" placeholder="Email" type="email" value={form.legal_rep?.email ?? ""}
                 onChange={(e) => up("legal_rep", { ...form.legal_rep, email: e.target.value })} />
        </div>
      </fieldset>
      <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>Save facility</Button>
      </div>
    </form>
  );
}
