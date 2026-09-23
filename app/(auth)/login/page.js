"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Activity,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/");
    router.refresh();
  }

  function fillDemo(demoEmail, demoPassword) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in-50 duration-300 slide-in-from-bottom-2">
      {/* Top branding / logo anchor */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/20">
            <Activity className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">DocRx Portal</span>
        </div>
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to access your clinical dashboard and patient records.
          </p>
        </div>
      </div>

      {/* Forgot Password Notice / Modal popup */}
      {showForgotNotice && (
        <div className="relative p-3.5 rounded-xl border border-info/30 bg-info/10 text-foreground text-xs space-y-1.5 animate-in fade-in-50">
          <button
            type="button"
            onClick={() => setShowForgotNotice(false)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-0.5"
            aria-label="Close notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-2 font-semibold text-info">
            <Info className="h-4 w-4 shrink-0" />
            <span>Password Reset Notice</span>
          </div>
          <p className="text-muted-foreground leading-relaxed pr-4">
            For PMDC clinical compliance and healthcare data protection, password resets are handled directly by your Clinic Administrator. Please contact your system administrator to update your credentials.
          </p>
        </div>
      )}

      {/* Main Authentication Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field with Icon prefix */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-foreground">
            Email address
          </Label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="dr.ahmed.raza@drclinic.pk"
              className="pl-10 h-11 text-sm bg-background border-border/80 focus-visible:ring-primary focus-visible:border-primary"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password Field with Icon prefix and Eye toggle */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-foreground">
            Password
          </Label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="pl-10 pr-10 h-11 text-sm bg-background border-border/80 focus-visible:ring-primary focus-visible:border-primary"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password links */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary accent-primary h-3.5 w-3.5 cursor-pointer"
            />
            <span>Remember me for 30 days</span>
          </label>
          <button
            type="button"
            onClick={() => setShowForgotNotice(true)}
            className="font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Semantic Error Alert (uses destructive design tokens, not raw inline hex) */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive text-sm animate-in fade-in-50"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{error}</span>
          </div>
        )}

        {/* Primary Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign in to account</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </>
          )}
        </Button>
      </form>

      {/* Demo Credentials Quick-Fill (helpful for testing & evaluation) */}
      <div className="pt-5 border-t border-border/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Demo Accounts
          </span>
          <span className="text-[11px] text-muted-foreground/70">Click role to fill</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillDemo("dr.ahmed.raza@drclinic.pk", "Doctor@123")}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-card hover:bg-accent hover:border-primary/40 text-foreground transition-all text-center truncate shadow-2xs"
          >
            Doctor
          </button>
          <button
            type="button"
            onClick={() => fillDemo("admin@clinic.com", "admin123")}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-card hover:bg-accent hover:border-primary/40 text-foreground transition-all text-center truncate shadow-2xs"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => fillDemo("sara.ahmed@drclinic.pk", "Reception@123")}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-card hover:bg-accent hover:border-primary/40 text-foreground transition-all text-center truncate shadow-2xs"
          >
            Receptionist
          </button>
        </div>
      </div>
    </div>
  );
}