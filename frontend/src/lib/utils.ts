import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { ApplicationStatus, Stage } from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZM", { year: "numeric", month: "short", day: "2-digit" });
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-ZM", {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function fmtMoney(amount?: number | null, currency = "ZMW"): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-ZM", {
    style: "currency", currency, maximumFractionDigits: 2,
  }).format(amount);
}

export function statusBadgeClass(status: ApplicationStatus | string): string {
  switch (status) {
    case "draft":             return "badge-gray";
    case "payment_pending":   return "badge-amber";
    case "under_review":      return "badge-blue";
    case "info_requested":    return "badge-amber";
    case "rejected":          return "badge-red";
    case "licence_generated":
    case "active":            return "badge-green";
    default:                  return "badge-gray";
  }
}

export function stageBadgeClass(stage: Stage | string): string {
  if (stage === "licence_generated") return "badge-green";
  if (stage === "rejected") return "badge-red";
  if (stage === "info_requested") return "badge-amber";
  if (stage === "draft") return "badge-gray";
  if (stage === "submitted") return "badge-amber";
  return "badge-blue";
}
