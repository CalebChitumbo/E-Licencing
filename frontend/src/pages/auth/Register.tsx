import { CircleDot, KeyRound, Mail, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../lib/auth";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function up<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    setBusy(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-yellow-300">
            <CircleDot className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-2xl">Create your applicant account</h1>
          <p className="mt-1 text-sm text-slate-600">
            For organisations applying for radiation licences.
          </p>
        </div>
        <div className="surface p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <div className="relative">
                <UserPlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="name" required className="input pl-9"
                       value={form.displayName} onChange={up("displayName")} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="email" type="email" autoComplete="email" required
                       className="input pl-9" value={form.email} onChange={up("email")} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="password" type="password" autoComplete="new-password" required minLength={12}
                       className="input pl-9" value={form.password} onChange={up("password")} />
              </div>
              <div className="mt-1 text-xs text-slate-500">Minimum 12 characters.</div>
            </div>
            <Button type="submit" loading={busy} className="w-full">Create account</Button>
            <div className="text-center text-sm text-slate-600">
              Already have an account? <Link to="/login" className="font-medium text-brand-500 hover:underline">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
