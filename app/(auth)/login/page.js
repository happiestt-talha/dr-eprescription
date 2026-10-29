"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { filterEmail, formatPhoneTyping, isValidEmail, normalizeEmail, normalizePhonePK } from "@/lib/sanitize";

const TABS = [
  { id: "staff", label: "Staff" },
  { id: "patient", label: "Patient" },
];
const TAB_KEY = "medscript.loginTab";

// The last-used tab is a per-device convenience kept in localStorage. Read via
// useSyncExternalStore so the server render ("staff") and the browser agree.
// `memoryTab` keeps switching working when storage is blocked.
const tabListeners = new Set();
let memoryTab = null;
function readSavedTab() {
  if (memoryTab) return memoryTab;
  try {
    return localStorage.getItem(TAB_KEY) === "patient" ? "patient" : "staff";
  } catch {
    return "staff";
  }
}
function saveTab(tab) {
  memoryTab = tab;
  try {
    localStorage.setItem(TAB_KEY, tab);
  } catch {}
  tabListeners.forEach((listener) => listener());
}
function subscribeTab(listener) {
  tabListeners.add(listener);
  return () => tabListeners.delete(listener);
}

const fieldClass =
  "h-11 rounded-lg bg-card px-3.5 text-[15px] md:text-sm border-border shadow-[0_1px_0_rgba(16,24,20,0.03)] focus-visible:ring-primary/25 focus-visible:border-primary";

export default function LoginPage() {
  const router = useRouter();
  const tab = useSyncExternalStore(subscribeTab, readSavedTab, () => "staff");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchTab(next) {
    saveTab(next);
    setError("");
    setFieldError("");
  }

  // The identifier each tab submits, in the canonical stored form.
  function identifier() {
    if (tab === "staff") {
      const value = normalizeEmail(email);
      return isValidEmail(value) ? value : null;
    }
    return normalizePhonePK(phone) || null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const id = identifier();
    if (!id) {
      setFieldError(
        tab === "staff"
          ? "Enter a valid email, e.g. name@clinic.pk"
          : "Enter the mobile number you registered with, e.g. 0300-1234567"
      );
      return;
    }
    setFieldError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", { email: id, password, redirect: false });
      if (res?.error) {
        setError(
          `That ${tab === "staff" ? "email" : "phone number"} and password don't match. After 5 failed attempts, sign-in is paused for 15 minutes.`
        );
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[360px] animate-in fade-in-0 slide-in-from-bottom-1 duration-500">
      <h1 className="text-[1.75rem] font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {tab === "staff" ? "Doctors, reception and admins sign in with their email." : "Patients sign in with their mobile number."}
      </p>

      <div role="tablist" aria-label="Who is signing in" className="mt-7 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="login-form"
            onClick={() => switchTab(t.id)}
            className={cn(
              "h-9 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              tab === t.id ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form id="login-form" role="tabpanel" aria-labelledby={`tab-${tab}`} onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        {tab === "staff" ? (
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(filterEmail(e.target.value));
                setFieldError("");
              }}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={120}
              placeholder="name@clinic.pk"
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? "id-error" : undefined}
              className={fieldClass}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[13px] font-medium">
              Mobile number
            </Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => {
                setPhone(formatPhoneTyping(e.target.value));
                setFieldError("");
              }}
              autoComplete="username"
              maxLength={16}
              placeholder="0300-1234567"
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? "id-error" : "phone-hint"}
              className={fieldClass}
            />
            {!fieldError && (
              <p id="phone-hint" className="text-xs text-muted-foreground">
                The mobile number you registered with at the clinic.
              </p>
            )}
          </div>
        )}
        {fieldError && (
          <p id="id-error" role="alert" className="-mt-3 text-xs text-destructive">
            {fieldError}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[13px] font-medium">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={`${fieldClass} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-11 rounded-lg text-sm font-semibold mt-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Signing in
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>

      <p className="mt-8 text-xs text-muted-foreground">
        Forgot your password? Ask your clinic administrator to reset it.
      </p>
    </div>
  );
}
