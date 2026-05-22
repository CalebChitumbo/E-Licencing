import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { RoleGate } from "./components/RoleGate";
import { useAuth } from "./lib/auth";
import { STAFF_ROLES } from "./lib/types";

import { ApplicantDashboardPage } from "./pages/applicant/Dashboard";
import { ApplicationDetailPage } from "./pages/applicant/ApplicationDetail";
import { ApplicationsListPage } from "./pages/applicant/Applications";
import { FacilitiesPage } from "./pages/applicant/Facilities";
import { NewApplicationPage } from "./pages/applicant/NewApplication";
import { PaymentsPage } from "./pages/applicant/Payments";
import { LoginPage } from "./pages/auth/Login";
import { RegisterPage } from "./pages/auth/Register";
import { VerifyInvoicePage } from "./pages/accounts/VerifyInvoice";
import { InvoiceQueuePage } from "./pages/accounts/InvoiceQueue";
import { AdminFeesPage } from "./pages/admin/Fees";
import { AdminUsersPage } from "./pages/admin/Users";
import { PublicVerifyPage } from "./pages/public/Verify";
import { StaffQueuePage } from "./pages/staff/Queue";
import { ApplicationReviewPage } from "./pages/staff/Review";

function Home() {
  const { profile, loading, firebaseUser } = useAuth();
  if (loading) return null;
  if (!firebaseUser || !profile) return <Navigate to="/login" replace />;
  if (profile.role === "applicant") return <Navigate to="/app" replace />;
  if (profile.role === "accounts") return <Navigate to="/accounts/invoices" replace />;
  if (profile.role === "admin") return <Navigate to="/admin/users" replace />;
  return <Navigate to="/staff/queue" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify/:licenceNumber" element={<PublicVerifyPage />} />

      <Route path="/app" element={<RoleGate roles={["applicant"]}><AppShell><ApplicantDashboardPage /></AppShell></RoleGate>} />
      <Route path="/app/facilities" element={<RoleGate roles={["applicant"]}><AppShell><FacilitiesPage /></AppShell></RoleGate>} />
      <Route path="/app/applications" element={<RoleGate roles={["applicant"]}><AppShell><ApplicationsListPage /></AppShell></RoleGate>} />
      <Route path="/app/applications/new" element={<RoleGate roles={["applicant"]}><AppShell><NewApplicationPage /></AppShell></RoleGate>} />
      <Route path="/app/applications/:id" element={<RoleGate roles={["applicant"]}><AppShell><ApplicationDetailPage /></AppShell></RoleGate>} />
      <Route path="/app/payments" element={<RoleGate roles={["applicant"]}><AppShell><PaymentsPage /></AppShell></RoleGate>} />

      <Route path="/staff/queue" element={<RoleGate roles={STAFF_ROLES}><AppShell><StaffQueuePage /></AppShell></RoleGate>} />
      <Route path="/staff/applications/:id" element={<RoleGate roles={STAFF_ROLES}><AppShell><ApplicationReviewPage /></AppShell></RoleGate>} />

      <Route path="/accounts/invoices" element={<RoleGate roles={["accounts", "admin"]}><AppShell><InvoiceQueuePage /></AppShell></RoleGate>} />
      <Route path="/accounts/invoices/:id" element={<RoleGate roles={["accounts", "admin"]}><AppShell><VerifyInvoicePage /></AppShell></RoleGate>} />

      <Route path="/admin/users" element={<RoleGate roles={["admin"]}><AppShell><AdminUsersPage /></AppShell></RoleGate>} />
      <Route path="/admin/fees" element={<RoleGate roles={["admin"]}><AppShell><AdminFeesPage /></AppShell></RoleGate>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
