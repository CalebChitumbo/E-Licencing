import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { SkeletonRow } from "../../components/ui/Skeleton";
import { toast } from "../../components/ui/Toaster";
import { asApiError } from "../../lib/api";
import { useAssignRole, useUsers } from "../../lib/queries";
import { ROLE_LABELS, type Role } from "../../lib/types";

const ROLES: Role[] = Object.keys(ROLE_LABELS) as Role[];

export function AdminUsersPage() {
  const users = useUsers();
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    const list = users.data?.results || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((u) =>
      (u.email || "").toLowerCase().includes(q) ||
      (u.display_name || "").toLowerCase().includes(q),
    );
  }, [users.data, search]);

  return (
    <div className="space-y-6">
      <PageHeader title="Users & roles"
                  description="Assign staff roles. Every authenticated user lands here on first sign-in." />

      <Card>
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search by name or email…"
                   value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="ml-auto text-xs text-slate-500">{items.length} users</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-80">Change role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.isLoading &&
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
              {!users.isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10">
                    <EmptyState icon={Users} title="No users to show" />
                  </td>
                </tr>
              )}
              {items.map((u) => <UserRow key={u.uid} user={u} />)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function UserRow({ user }: { user: { uid: string; email: string; role: Role; display_name?: string; is_active: boolean } }) {
  const [selectedRole, setSelectedRole] = useState<Role>(user.role);
  const assign = useAssignRole(user.uid);
  const initials = (user.display_name || user.email).split(/[\s@]/).filter(Boolean).slice(0, 2)
    .map((s) => s[0]?.toUpperCase()).join("") || "?";

  async function onSave() {
    try {
      await assign.mutateAsync(selectedRole);
      toast.success(`Role updated to ${ROLE_LABELS[selectedRole]}.`);
    } catch (err) {
      toast.error(asApiError(err).detail);
    }
  }

  return (
    <tr className="transition hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="font-medium text-slate-900">{user.display_name || user.uid}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-600">{user.email}</td>
      <td className="px-4 py-3"><Badge tone="blue">{ROLE_LABELS[user.role]}</Badge></td>
      <td className="px-4 py-3">
        <Badge tone={user.is_active ? "green" : "gray"}>{user.is_active ? "Active" : "Disabled"}</Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <select
            className="input"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as Role)}
          >
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <Button size="sm" loading={assign.isPending}
                  disabled={selectedRole === user.role} onClick={onSave}>
            Save
          </Button>
        </div>
      </td>
    </tr>
  );
}
