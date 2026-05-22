export type Role =
  | "applicant"
  | "nrso_lic"
  | "snrso_lic"
  | "nrso_insp"
  | "snrso_insp"
  | "mnrs"
  | "dnrs"
  | "techcom"
  | "ed"
  | "board_chair"
  | "accounts"
  | "admin";

export const STAFF_ROLES: Role[] = [
  "nrso_lic", "snrso_lic", "nrso_insp", "snrso_insp",
  "mnrs", "dnrs", "techcom", "ed", "board_chair", "accounts", "admin",
];

export const ROLE_LABELS: Record<Role, string> = {
  applicant: "Applicant",
  nrso_lic: "NRSO (Licensing)",
  snrso_lic: "Senior NRSO (Licensing)",
  nrso_insp: "NRSO (Inspection)",
  snrso_insp: "Senior NRSO (Inspection)",
  mnrs: "Manager — Nuclear & Radiation Safety",
  dnrs: "Director — Nuclear & Radiation Safety",
  techcom: "Technical Committee",
  ed: "Executive Director",
  board_chair: "Board Chairperson",
  accounts: "Accounts",
  admin: "System Administrator",
};

export type Stage =
  | "draft"
  | "submitted"
  | "nrso_review"
  | "snrso_review"
  | "mnrs_review"
  | "dnrs_review"
  | "ed_approval"
  | "licence_generated"
  | "info_requested"
  | "rejected";

export const STAGE_LABELS: Record<Stage, string> = {
  draft: "Draft",
  submitted: "Awaiting Payment Verification",
  nrso_review: "NRSO Licensing Review",
  snrso_review: "Senior NRSO Review",
  mnrs_review: "Manager — N&RS Review",
  dnrs_review: "Director — N&RS Review",
  ed_approval: "Executive Director Approval",
  licence_generated: "Licence Issued",
  info_requested: "Information Requested",
  rejected: "Rejected",
};

export const STAGE_ORDER: Stage[] = [
  "draft", "submitted", "nrso_review", "snrso_review",
  "mnrs_review", "dnrs_review", "ed_approval", "licence_generated",
];

export type ApplicationStatus =
  | "draft"
  | "payment_pending"
  | "under_review"
  | "info_requested"
  | "rejected"
  | "licence_generated";

export interface User {
  uid: string;
  email: string;
  display_name?: string;
  phone?: string;
  role: Role;
  is_active: boolean;
  mfa_enabled?: boolean;
}

export interface GPS { lat: number; lng: number }

export interface Contact {
  name?: string;
  nrc?: string;
  phone?: string;
  email?: string;
}

export interface RPO {
  name: string;
  qualifications?: string;
  phone: string;
  email?: string;
}

export interface Facility {
  id: string;
  owner_uid: string;
  name: string;
  type: "medical" | "industrial" | "research" | "educational" | "veterinary" | "transport" | "other";
  legal_rep: Contact;
  pacra_number?: string;
  gov_entity?: boolean;
  rpo?: RPO | null;
  address?: string;
  province?: string;
  district?: string;
  gps?: GPS | null;
  notification_contacts?: Contact[];
  created_at?: string;
  updated_at?: string;
}

export interface Source {
  id: string;
  type: string;
  make?: string;
  model?: string;
  serial?: string;
  activity_bq?: number | null;
  nuclide?: string;
  half_life_days?: number | null;
  status: "active" | "stored" | "disposed" | "transferred";
}

export type FormType = "FORM_I" | "FORM_V" | "FORM_VI" | "FORM_VIII" | "FORM_IX" | "FORM_XIII";

export interface Application {
  id: string;
  form_type: FormType;
  applicant_uid: string;
  facility_id: string;
  facility_snapshot?: Partial<Facility> & { id?: string };
  current_stage: Stage;
  status: ApplicationStatus;
  assigned_to_uid?: string;
  submitted_at?: string | null;
  sla_deadline?: string | null;
  wizard_data?: Record<string, unknown>;
  fee_amount?: number | null;
  invoice_id?: string;
  licence_id?: string;
  rejected_reason?: string;
  info_request?: { reason?: string; from_stage?: string; at?: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuditEvent {
  id: string;
  actor_uid: string;
  actor_role: string;
  action: string;
  from_stage?: string;
  to_stage?: string;
  reason?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export interface Invoice {
  id: string;
  application_id: string;
  applicant_uid: string;
  line_items: { description: string; amount: number; qty: number }[];
  total: number;
  currency: string;
  status: "pending" | "verified" | "cancelled";
  payment_ref?: string;
  proof_storage_path?: string;
  verified_by?: string;
  verified_at?: string | null;
  created_at?: string;
}

export interface Licence {
  licence_number: string;
  application_id: string;
  holder_name: string;
  facility_snapshot: Partial<Facility>;
  issued_at: string;
  expires_at: string;
  conditions: string[];
  status: "active" | "suspended" | "revoked" | "expired" | "surrendered";
  pdf_storage_path?: string;
}

export interface PublicLicence {
  licence_number: string;
  holder_name: string;
  facility_name: string;
  facility_district: string;
  facility_province: string;
  issued_at: string;
  expires_at: string;
  status: string;
  verify_url: string;
}

export interface Paginated<T> {
  results: T[];
}
