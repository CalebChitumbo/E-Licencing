import { CircleDot, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { toast } from "../../components/ui/Toaster";
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
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword(email);
      toast.success("If that account exists, a reset link has been sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-yellow-300">
            <CircleDot className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <div>
            <div className="text-sm font-semibold">RPA-IRMS</div>
            <div className="text-xs text-brand-100">
              Integrated Regulatory Information Management System
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-semibold text-balance">
            Apply for, track, and verify radiation licences — entirely online.
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            The Radiation Protection Authority of Zambia processes licensing,
            inspections, technical services, and enforcement on a single,
            auditable, regulator-grade platform.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-yellow-300" /> Digitally signed licences with QR verification</li>
            <li className="flex items-center gap-3"><KeyRound className="h-4 w-4 text-yellow-300" /> Role-based access for every step of the workflow</li>
            <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-yellow-300" /> Email + in-app notifications at each stage</li>
          </ul>
        </div>
        <div className="text-xs text-brand-100/80">
          © Radiation Protection Authority of Zambia · IRP Act No. 16 of 2005
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-yellow-300">
              <CircleDot className="h-6 w-6" />
            </span>
            <h1 className="mt-3 text-xl">RPA-IRMS</h1>
          </div>
          <h1 className="text-2xl">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back. Enter your credentials to continue.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="email" type="email" autoComplete="email" required
                       className="input pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label className="label" htmlFor="password">Password</label>
                <button type="button" onClick={onReset} className="text-xs text-brand-500 hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="password" type="password" autoComplete="current-password" required
                       className="input pl-9" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <Button type="submit" loading={busy} className="w-full">Sign in</Button>
            <div className="text-center text-sm text-slate-600">
              New here? <Link to="/register" className="font-medium text-brand-500 hover:underline">Create an account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
