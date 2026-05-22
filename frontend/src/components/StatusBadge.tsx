import type { ApplicationStatus, Stage } from "../lib/types";
import { STAGE_LABELS } from "../lib/types";
import { stageBadgeClass, statusBadgeClass } from "../lib/utils";

export function StatusBadge({ status }: { status: ApplicationStatus | string }) {
  const label = status.replace(/_/g, " ");
  return <span className={statusBadgeClass(status)}>{label}</span>;
}

export function StageBadge({ stage }: { stage: Stage }) {
  return <span className={stageBadgeClass(stage)}>{STAGE_LABELS[stage] || stage}</span>;
}
