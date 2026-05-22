import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../lib/auth";
import type { Role } from "../lib/types";

interface Props {
  children: ReactNode;
  roles?: Role[];
}

export function RoleGate({ children, roles }: Props) {
  const { profile, loading, firebaseUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }
  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Your profile could not be loaded.
      </div>
    );
  }
  if (roles && !roles.includes(profile.role)) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-slate-600">
          Your role ({profile.role}) cannot view this page.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
