import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { get, patch, post, put } from "./api";
import type {
  Application,
  AuditEvent,
  Facility,
  Invoice,
  Licence,
  Paginated,
  PublicLicence,
  Source,
  User,
} from "./types";

export const keys = {
  me: ["me"] as const,
  facilities: ["facilities"] as const,
  facility: (id: string) => ["facilities", id] as const,
  sources: (facilityId: string) => ["facilities", facilityId, "sources"] as const,
  applications: ["applications"] as const,
  application: (id: string) => ["applications", id] as const,
  applicationAudit: (id: string) => ["applications", id, "audit"] as const,
  queue: ["queue"] as const,
  myQueue: ["queue", "mine"] as const,
  invoices: (scope: string) => ["invoices", scope] as const,
  invoice: (id: string) => ["invoices", id] as const,
  notifications: ["notifications"] as const,
  licence: (n: string) => ["licences", n] as const,
  publicLicence: (n: string) => ["public", "licences", n] as const,
  fees: ["admin", "fees"] as const,
  users: (role?: string) => ["admin", "users", role || "all"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => get<User>("/me"),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<User>) => patch<User>("/me", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.me }),
  });
}

export function useFacilities() {
  return useQuery({
    queryKey: keys.facilities,
    queryFn: () => get<Paginated<Facility>>("/facilities"),
  });
}

export function useFacility(id: string | undefined) {
  return useQuery({
    queryKey: keys.facility(id || ""),
    queryFn: () => get<Facility>(`/facilities/${id}`),
    enabled: !!id,
  });
}

export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Facility>) => post<Facility>("/facilities", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.facilities }),
  });
}

export function useUpdateFacility(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Facility>) => patch<Facility>(`/facilities/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.facilities });
      qc.invalidateQueries({ queryKey: keys.facility(id) });
    },
  });
}

export function useSources(facilityId: string | undefined) {
  return useQuery({
    queryKey: keys.sources(facilityId || ""),
    queryFn: () => get<Paginated<Source>>(`/facilities/${facilityId}/sources`),
    enabled: !!facilityId,
  });
}

export function useAddSource(facilityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Source>) => post<Source>(`/facilities/${facilityId}/sources`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sources(facilityId) }),
  });
}

export function useApplications() {
  return useQuery({
    queryKey: keys.applications,
    queryFn: () => get<Paginated<Application>>("/applications"),
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: keys.application(id || ""),
    queryFn: () => get<Application>(`/applications/${id}`),
    enabled: !!id,
  });
}

export function useApplicationAudit(id: string | undefined) {
  return useQuery({
    queryKey: keys.applicationAudit(id || ""),
    queryFn: () => get<Paginated<AuditEvent>>(`/applications/${id}/audit`),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { form_type: string; facility_id: string }) =>
      post<Application>("/applications", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.applications }),
  });
}

export function useUpdateWizard(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { step: number; data: Record<string, unknown> }) =>
      patch<Application>(`/applications/${id}/wizard`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.application(id) }),
  });
}

export function useSubmitApplication(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post<Application & { invoice_id: string }>(`/applications/${id}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.application(id) });
      qc.invalidateQueries({ queryKey: keys.applications });
    },
  });
}

export function useTransition(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { action: string; reason?: string; assignee_uid?: string }) =>
      post<Application>(`/applications/${id}/transition`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.application(id) });
      qc.invalidateQueries({ queryKey: keys.applicationAudit(id) });
      qc.invalidateQueries({ queryKey: keys.queue });
    },
  });
}

export function useQueue(mine = false) {
  return useQuery({
    queryKey: mine ? keys.myQueue : keys.queue,
    queryFn: () => get<Paginated<Application>>(`/queue${mine ? "?mine=1" : ""}`),
  });
}

export function useInvoices(scope: "pending" | "verified" | "mine" = "pending") {
  return useQuery({
    queryKey: keys.invoices(scope),
    queryFn: () => get<Paginated<Invoice>>(
      scope === "mine" ? "/invoices" : `/invoices?status=${scope}`,
    ),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: keys.invoice(id || ""),
    queryFn: () => get<Invoice>(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function useVerifyInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { payment_ref: string; notes?: string }) =>
      post<Invoice>(`/invoices/${id}/verify`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.invoice(id) });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: keys.queue });
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: keys.notifications,
    queryFn: () => get<Paginated<{
      id: string; subject: string; body: string; read_at?: string | null; created_at?: string;
    }>>("/notifications"),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications }),
  });
}

export function useLicence(licenceNumber: string | undefined) {
  return useQuery({
    queryKey: keys.licence(licenceNumber || ""),
    queryFn: () => get<Licence>(`/licences/${licenceNumber}`),
    enabled: !!licenceNumber,
  });
}

export function useLicenceDownload(licenceNumber: string | undefined) {
  return useMutation({
    mutationFn: () => get<{ url: string }>(`/licences/${licenceNumber}/download`),
  });
}

export function usePublicLicence(licenceNumber: string | undefined) {
  return useQuery({
    queryKey: keys.publicLicence(licenceNumber || ""),
    queryFn: () => get<PublicLicence>(`/public/licences/${licenceNumber}`),
    enabled: !!licenceNumber,
    retry: false,
  });
}

export function useFeeSchedule() {
  return useQuery({
    queryKey: keys.fees,
    queryFn: () => get<{ fees: Record<string, number>; currency: string }>("/admin/config/fees"),
  });
}

export function useSetFeeSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { fees: Record<string, number> }) =>
      put<{ fees: Record<string, number>; currency: string }>("/admin/config/fees", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.fees }),
  });
}

export function useUsers(role?: string) {
  return useQuery({
    queryKey: keys.users(role),
    queryFn: () => get<Paginated<User>>(role ? `/admin/users?role=${role}` : "/admin/users"),
  });
}

export function useAssignRole(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: string) => post<User>(`/admin/users/${uid}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
