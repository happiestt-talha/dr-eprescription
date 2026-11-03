"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Check, KeyRound, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Form, FormStatus, SubmitButton } from "@/components/ui/form";
import { Field } from "@/components/ui/form-layout";
import { PasswordInput } from "@/components/ui/form-inputs";
import { changePassword } from "@/lib/actions/account";
import { cn } from "@/lib/utils";

export function ChangePasswordForm({ required, home }) {
  const { update } = useSession();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  const checks = [
    { ok: next.length >= 10, text: "At least 10 characters" },
    { ok: next.length > 0 && next !== current, text: "Different from your current password" },
    { ok: next.length > 0 && next === confirm, text: "Both new passwords match" },
  ];

  // Runs once every field passes its inline check; server errors (wrong
  // current password, contains your login) land on the matching field.
  async function handleSubmit(formData) {
    const res = await changePassword(formData);
    if (res?.error) return res;
    setDone(true);
    // Refresh the session so the "must change" flag is cleared right away.
    // update() needs an argument: without one NextAuth only re-reads the
    // session (GET) and the jwt callback never sees trigger "update".
    await update({ passwordChanged: true });
    // A full page load, not router.push: the client router may still hold
    // the redirect it cached while the password change was pending.
    window.location.assign(home);
    return res;
  }

  return (
    <div className="w-full max-w-[400px] rounded-lg border border-border bg-card p-6 sm:p-8">
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

      <Form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label={required ? "Temporary password" : "Current password"} htmlFor="currentPassword">
          <PasswordInput id="currentPassword" name="currentPassword" label="Current password" requiredOnly autoComplete="current-password" onValueChange={setCurrent} fieldSize="lg" />
        </Field>
        <Field label="New password" htmlFor="newPassword">
          <PasswordInput
            id="newPassword"
            name="newPassword"
            label="New password"
            autoComplete="new-password"
            onValueChange={setNext}
            validate={(v) => (v === current ? "Choose a password different from your current one" : "")}
            fieldSize="lg"
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword">
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm new password"
            requiredOnly
            autoComplete="new-password"
            onValueChange={setConfirm}
            validate={(v) => (v !== next ? "The new passwords don't match" : "")}
            fieldSize="lg"
          />
        </Field>

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

        <FormStatus variant="dialog" />

        <SubmitButton
          disabled={done}
          pendingText={
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
              Saving…
            </>
          }
          className="w-full h-11 rounded-lg text-sm font-semibold">
          Save new password
        </SubmitButton>
      </Form>

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
