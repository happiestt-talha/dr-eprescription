"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Check, KeyRound, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/actions/account";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 rounded-lg bg-card px-3.5 pr-16 text-[15px] md:text-sm border-border focus-visible:ring-primary/25 focus-visible:border-primary";

function PasswordField({ id, label, autoComplete, value, onChange, hint, show, onToggle }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          maxLength={200}
          required
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={fieldClass}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {hint}
    </div>
  );
}

export function ChangePasswordForm({ required, home }) {
  const { update } = useSession();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const checks = [
    { ok: next.length >= 10, text: "At least 10 characters" },
    { ok: next.length > 0 && next !== current, text: "Different from your current password" },
    { ok: next.length > 0 && next === confirm, text: "Both new passwords match" },
  ];
  const ready = current && checks.every((c) => c.ok);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ready || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await changePassword(new FormData(e.target));
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setDone(true);
      // Refresh the session so the "must change" flag is cleared right away.
      // update() needs an argument: without one NextAuth only re-reads the
      // session (GET) and the jwt callback never sees trigger "update".
      await update({ passwordChanged: true });
      // A full page load, not router.push: the client router may still hold
      // the redirect it cached while the password change was pending.
      window.location.assign(home);
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setLoading(false);
    }
  }

  const toggle = (field) => setShow((s) => ({ ...s, [field]: !s[field] }));

  return (
    <div className="w-full max-w-[400px] rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_1px_2px_rgba(16,24,20,0.04)] animate-in fade-in-0 slide-in-from-bottom-1 duration-500">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <KeyRound className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-[1.5rem] font-semibold tracking-tight">
        {required ? "Choose your own password" : "Change password"}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {required
          ? "You're signed in with a temporary password that someone else knows. Set a private one to continue."
          : "Use a password you don't use anywhere else."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <PasswordField
          id="currentPassword"
          label={required ? "Temporary password" : "Current password"}
          autoComplete="current-password"
          value={current}
          onChange={setCurrent}
          show={show.currentPassword}
          onToggle={() => toggle("currentPassword")}
        />
        <PasswordField
          id="newPassword"
          label="New password"
          autoComplete="new-password"
          value={next}
          onChange={setNext}
          show={show.newPassword}
          onToggle={() => toggle("newPassword")}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          show={show.confirmPassword}
          onToggle={() => toggle("confirmPassword")}
        />

        <ul className="space-y-1.5 pt-1" aria-label="Password requirements">
          {checks.map((c) => (
            <li key={c.text} className={cn("flex items-center gap-2 text-xs", c.ok ? "text-primary" : "text-muted-foreground")}>
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border",
                  c.ok ? "border-primary bg-primary text-primary-foreground" : "border-border"
                )}
                aria-hidden="true"
              >
                {c.ok ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
              {c.text}
              <span className="sr-only">{c.ok ? "(done)" : "(not yet)"}</span>
            </li>
          ))}
        </ul>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={!ready || loading || done} className="w-full h-11 rounded-lg text-sm font-semibold">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
              Saving
            </>
          ) : (
            "Save new password"
          )}
        </Button>
      </form>

      <div className="mt-5 flex items-center justify-between text-xs">
        {required ? (
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="text-muted-foreground hover:text-foreground">
            Sign out instead
          </button>
        ) : (
          <Link href={home} className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-xs")}>
            Back to dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
