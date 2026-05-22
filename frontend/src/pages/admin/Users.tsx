import { useState } from "react";

import { ErrorBox, Spinner } from "../../components/Spinner";
import { asApiError } from "../../lib/api";
import { useAssignRole, useUsers } from "../../lib/queries";
import { ROLE_LABELS, type Role } from "../../lib/types";

const ROLES: Role[] = Object.keys(ROLE_LABELS) as Role[];

export function AdminUsersPage() {
  const users = useUsers();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl">User & role management</h1>
      {users.isLoading && <Spinner />}
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 w-72">Change role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.data?.results.map((u) => (
              <UserRow key={u.uid} user={u} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({ user }: { user: { uid: string; email: string; role: Role; display_name?: string; is_active: boolean } }) {
  const [selectedRole, setSelectedRole] = useState<Role>(user.role);
  const [error, setError] = useState<string | null>(null);
  const assign = useAssignRole(user.uid);

  async function onSave() {
    setError(null);
    try {
      await assign.mutateAsync(selectedRole);
    } catch (err) {
      setError(asApiError(err).detail);
    }
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-2">{user.display_name || user.uid}</td>
      <td className="px-4 py-2">{user.email}</td>
      <td className="px-4 py-2">{ROLE_LABELS[user.role]}</td>
      <td className="px-4 py-2">{user.is_active ? "Active" : "Disabled"}</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <select
            className="input"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as Role)}
          >
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <button className="btn-primary" onClick={onSave}
                  disabled={assign.isPending || selectedRole === user.role}>
            Save
          </button>
        </div>
        {error && <div className="mt-1"><ErrorBox>{error}</ErrorBox></div>}
      </td>
    </tr>
  );
}
