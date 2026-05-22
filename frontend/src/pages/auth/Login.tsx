import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ErrorBox } from "../../components/Spinner";
import { useAuth } from "../../lib/auth";

export function LoginPage() {
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (!email) return setError("Enter your email first to reset.");
    setBusy(true);
    setError(null);
    try {
      await resetPassword(email);
      setError("Password reset email sent (if the account exists).");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-sm card">
        <div className="card-header text-center text-lg">RPA-IRMS sign in</div>
        <form onSubmit={onSubmit} className="card-body space-y-4">
          {error && <ErrorBox>{error}</ErrorBox>}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required
                   className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" required
                   className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary w-full" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <button type="button" onClick={onReset} className="hover:underline">
              Forgot password?
            </button>
            <Link to="/register" className="hover:underline">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
