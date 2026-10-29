"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { resetDoctorPassword, resetPatientPassword } from "@/lib/actions/account";
import { formatPhoneDisplay } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

const ACTIONS = { patient: resetPatientPassword, doctor: resetDoctorPassword };

function CopyValue({ label, value }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the value is still on screen to read out.
    }
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-mono text-base font-semibold">{value}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={copy} className="h-8 rounded-lg px-2.5" aria-label={`Copy ${label.toLowerCase()}`}>
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      </Button>
    </div>
  );
}

/**
 * "Reset password" for a patient (reception, doctors, admins) or a doctor
 * (admins). Confirms, then shows the new temporary password once; the person
 * must replace it at their next sign-in.
 */
export function ResetPasswordButton({ kind, targetId, name, className }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function handleOpenChange(next) {
    setOpen(next);
    if (!next) {
      // Forget the temporary password as soon as the dialog closes.
      setResult(null);
      setError("");
    }
  }

  async function reset() {
    setLoading(true);
    setError("");
    try {
      const res = await ACTIONS[kind](targetId);
      if (res?.error) setError(res.error);
      else setResult(res);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const username = result ? (result.username.includes("@") ? result.username : formatPhoneDisplay(result.username)) : "";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger className={cn(buttonVariants({ variant: "outline" }), "min-h-[44px]", className)}>
        <KeyRound className="mr-2 h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        Reset password
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-xl">
        {result ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>New temporary password</AlertDialogTitle>
              <AlertDialogDescription>
                Give these to {name} in person. They&apos;ll be asked to choose their own password when they sign in.
                This password won&apos;t be shown again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <CopyValue label={kind === "patient" ? "Username (phone)" : "Username (email)"} value={username} />
              <CopyValue label="Temporary password" value={result.tempPassword} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Done</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset {name}&apos;s password?</AlertDialogTitle>
              <AlertDialogDescription>
                Their current password stops working immediately. You&apos;ll get a temporary password to hand over, and
                they&apos;ll set their own at next sign-in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <Button onClick={reset} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {loading ? "Resetting" : "Reset password"}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
