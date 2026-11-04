"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Form, FormStatus, SubmitButton } from "@/components/ui/form";
import { Field } from "@/components/ui/form-layout";
import { EmailInput, PasswordInput, PhoneInput } from "@/components/ui/form-inputs";
import { cn } from "@/lib/utils";

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

export default function LoginPage() {
  const router = useRouter();
  const tab = useSyncExternalStore(subscribeTab, readSavedTab, () => "staff");

  // Runs once the inline checks pass (valid email / mobile, password entered).
  async function handleSubmit(formData) {
    const id = String(formData.get("identifier") || "");
    const res = await signIn("credentials", { email: id, password: formData.get("password"), redirect: false });
    if (res?.error) {
      return {
        error: `That ${tab === "staff" ? "email" : "phone number"} and password don't match. After 5 failed attempts, sign-in is paused for 15 minutes.`,
      };
    }
    // Stays pending while navigating.
    router.push("/");
    router.refresh();
    return { success: true };
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
            onClick={() => saveTab(t.id)}
            className={cn(
              "h-9 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              tab === t.id ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Keyed by tab, so switching starts with a clean form. */}
      <Form key={tab} id="login-form" role="tabpanel" aria-labelledby={`tab-${tab}`} onSubmit={handleSubmit} className="mt-6 space-y-5">
        {tab === "staff" ? (
          <Field label="Email" htmlFor="identifier" name="identifier">
            <EmailInput id="identifier" name="identifier" label="Email" required autoComplete="username" placeholder="name@clinic.pk" fieldSize="lg" />
          </Field>
        ) : (
          <Field label="Mobile number" htmlFor="identifier" name="identifier" hint="The mobile number you registered with at the clinic.">
            <PhoneInput id="identifier" name="identifier" label="Mobile number" required autoComplete="username" aria-describedby="identifier-hint" fieldSize="lg" />
          </Field>
        )}

        <Field label="Password" htmlFor="password">
          <PasswordInput id="password" name="password" label="Password" requiredOnly autoComplete="current-password" fieldSize="lg" />
        </Field>

        <SubmitButton
          pendingText={
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Signing in
            </>
          }
          className="w-full h-11 rounded-lg text-sm font-semibold mt-2">
          Sign in
        </SubmitButton>

        <FormStatus variant="dialog" />
      </Form>

      <p className="mt-8 text-xs text-muted-foreground">
        Forgot your password? Ask your clinic administrator to reset it.
      </p>
    </div>
  );
}
