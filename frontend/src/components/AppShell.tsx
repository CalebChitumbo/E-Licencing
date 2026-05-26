import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Banknote,
  Bell,
  Building2,
  CircleDot,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Receipt,
  Settings2,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { useNotifications } from "../lib/queries";
import { ROLE_LABELS, type Role } from "../lib/types";
import { cn, fmtDateTime } from "../lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV: Record<Role | "any", NavItem[]> = {
  applicant: [
    { to: "/app",              label: "Dashboard",     icon: LayoutDashboard },
    { to: "/app/facilities",   label: "Facilities",    icon: Building2 },
    { to: "/app/applications", label: "Applications",  icon: FileText },
    { to: "/app/payments",     label: "Payments",      icon: Banknote },
  ],
  nrso_lic:    [{ to: "/staff/queue", label: "My queue", icon: ListChecks }],
  snrso_lic:   [{ to: "/staff/queue", label: "My queue", icon: ListChecks }],
  nrso_insp:   [{ to: "/staff/queue", label: "My queue", icon: ListChecks }],
  snrso_insp:  [{ to: "/staff/queue", label: "My queue", icon: ListChecks }],
  mnrs:        [{ to: "/staff/queue", label: "My queue", icon: ListChecks }],
  dnrs:        [{ to: "/staff/queue", label: "My queue", icon: ListChecks }],
  techcom:     [{ to: "/staff/queue", label: "My queue", icon: ListChecks }],
  ed:          [{ to: "/staff/queue", label: "My queue", icon: ShieldCheck }],
  board_chair: [{ to: "/staff/queue", label: "My queue", icon: ListChecks }],
  accounts: [
    { to: "/accounts/invoices", label: "Invoices",     icon: Receipt },
    { to: "/staff/queue",       label: "Applications", icon: FileText },
  ],
  admin: [
    { to: "/admin/users",  label: "Users & roles",  icon: UserIcon },
    { to: "/admin/fees",   label: "Fee schedule",   icon: Banknote },
    { to: "/staff/queue",  label: "Applications",   icon: FileText },
  ],
  any: [],
};

function BrandMark() {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-yellow-300 shadow-inner ring-1 ring-white/10">
      <CircleDot className="h-5 w-5" strokeWidth={2.4} />
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const role = (profile?.role as Role) ?? "any";
  const items = NAV[role] || [];

  async function onLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">RPA-IRMS</div>
              <div className="text-[11px] text-slate-500">
                Radiation Protection Authority of Zambia
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu
              email={profile?.email || ""}
              name={profile?.display_name || profile?.email || ""}
              roleLabel={profile ? ROLE_LABELS[profile.role] : ""}
              onLogout={onLogout}
            />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-6 py-6">
        <aside className="hidden w-60 shrink-0 md:block">
          <nav className="sticky top-20 space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <div className="mt-6 rounded-xl border border-slate-200 bg-gradient-to-br from-brand-50 to-white p-4">
              <Sparkles className="h-4 w-4 text-brand-500" />
              <p className="mt-2 text-xs text-slate-600">
                Need help? Reach the licensing team at <span className="font-medium">licensing@rpa.gov.zm</span>.
              </p>
            </div>
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <footer className="border-t border-slate-200 bg-white/40 py-4 text-center text-xs text-slate-500">
        Radiation Protection Authority of Zambia · Ionising Radiation Protection Act No. 16 of 2005
      </footer>
    </div>
  );
}

function NotificationBell() {
  const notifications = useNotifications();
  const items = notifications.data?.results || [];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-40 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-lg
                     data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="border-b border-slate-100 px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Notifications
          </div>
          {items.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-slate-500">No notifications.</div>
          )}
          <div className="max-h-80 overflow-y-auto">
            {items.slice(0, 8).map((n) => (
              <div key={n.id} className="rounded-md px-3 py-2 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium text-slate-900">{n.subject}</div>
                  {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </div>
                <div className="text-xs text-slate-500 line-clamp-2">{n.body}</div>
                <div className="mt-1 text-[10px] text-slate-400">{fmtDateTime(n.created_at)}</div>
              </div>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function UserMenu({ email, name, roleLabel, onLogout }:
  { email: string; name: string; roleLabel: string; onLogout: () => void }) {
  const initials = (name || email)
    .split(/[\s@]/).filter(Boolean).slice(0, 2)
    .map((s) => s[0]?.toUpperCase()).join("") || "U";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-slate-100">
          <span className="hidden text-right md:block">
            <span className="block text-sm font-medium text-slate-900">{name}</span>
            <span className="block text-[11px] text-slate-500">{roleLabel}</span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
            {initials}
          </span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-40 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg
                     data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="px-3 py-2 text-xs text-slate-500">Signed in as<br/>
            <span className="font-medium text-slate-900">{email}</span>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
          <DropdownMenu.Item asChild>
            <Link to="/app" className="flex items-center gap-2 rounded px-3 py-2 text-sm outline-none hover:bg-slate-100">
              <Settings2 className="h-4 w-4" /> Profile & settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onLogout}
            className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-red-700 outline-none hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
