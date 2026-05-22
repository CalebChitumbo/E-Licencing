import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ErrorBox } from "../../components/Spinner";
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-sm card">
        <div className="card-header text-center text-lg">Register as Applicant</div>
        <form onSubmit={onSubmit} className="card-body space-y-4">
          {error && <ErrorBox>{error}</ErrorBox>}
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" required className="input"
                   value={form.displayName} onChange={up("displayName")} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required
                   className="input" value={form.email} onChange={up("email")} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password (min 12 chars)</label>
            <input id="password" type="password" autoComplete="new-password" required minLength={12}
                   className="input" value={form.password} onChange={up("password")} />
          </div>
          <button className="btn-primary w-full" type="submit" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
          <div className="text-sm text-slate-600 text-center">
            Already have an account? <Link to="/login" className="hover:underline">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
