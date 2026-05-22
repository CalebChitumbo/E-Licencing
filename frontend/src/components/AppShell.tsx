import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { ROLE_LABELS, type Role } from "../lib/types";
import { cn } from "../lib/utils";

const NAV: Record<Role | "any", { to: string; label: string }[]> = {
  applicant: [
    { to: "/app", label: "Dashboard" },
    { to: "/app/facilities", label: "Facilities" },
    { to: "/app/applications", label: "My Applications" },
    { to: "/app/payments", label: "Payments" },
  ],
  nrso_lic:    [{ to: "/staff/queue", label: "My Queue" }],
  snrso_lic:   [{ to: "/staff/queue", label: "My Queue" }],
  nrso_insp:   [{ to: "/staff/queue", label: "My Queue" }],
  snrso_insp:  [{ to: "/staff/queue", label: "My Queue" }],
  mnrs:        [{ to: "/staff/queue", label: "My Queue" }],
  dnrs:        [{ to: "/staff/queue", label: "My Queue" }],
  techcom:     [{ to: "/staff/queue", label: "My Queue" }],
  ed:          [{ to: "/staff/queue", label: "My Queue" }],
  board_chair: [{ to: "/staff/queue", label: "My Queue" }],
  accounts: [
    { to: "/accounts/invoices", label: "Invoices to verify" },
    { to: "/staff/queue", label: "All work in flight" },
  ],
  admin: [
    { to: "/admin/users", label: "Users" },
    { to: "/admin/fees", label: "Fee schedule" },
    { to: "/staff/queue", label: "All applications" },
  ],
  any: [],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role ?? "any";
  const items = NAV[role] || [];

  async function onLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-500 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/app" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-yellow-300" aria-hidden />
            <div>
              <div className="text-base font-semibold leading-tight">RPA-IRMS</div>
              <div className="text-xs text-brand-100 leading-tight">
                Radiation Protection Authority of Zambia
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <div className="hidden text-right md:block">
              <div className="font-medium">{profile?.display_name || profile?.email}</div>
              <div className="text-xs text-brand-100">{profile && ROLE_LABELS[profile.role]}</div>
            </div>
            <button onClick={onLogout} className="rounded bg-brand-600 px-3 py-1.5 hover:bg-brand-700">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-6 py-6">
        <aside className="w-56 shrink-0">
          <nav className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    "block rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-brand-500 text-white"
                      : "text-slate-700 hover:bg-slate-100",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Radiation Protection Authority of Zambia · Built on the Ionising Radiation Protection Act No. 16 of 2005
      </footer>
    </div>
  );
}
