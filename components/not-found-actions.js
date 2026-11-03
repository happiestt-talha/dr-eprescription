"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, SubmitButton } from "@/components/ui/form";
import { Field } from "@/components/ui/form-layout";
import { MaskedInput } from "@/components/ui/form-inputs";
import { prescriptionCode } from "@/lib/rules";

/** "Go back" that falls back to home when the page was opened directly. */
export function GoBackButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className="h-11 rounded-lg px-4"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
    >
      <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" />
      Go back
    </Button>
  );
}

/** Jump straight to a prescription's public verification page by its code. */
export function VerifyCodeForm() {
  const router = useRouter();

  function handleSubmit(formData) {
    const { value } = prescriptionCode(formData.get("code"));
    router.push(`/verify/${encodeURIComponent(value)}`);
    return { success: true };
  }

  return (
    <Form onSubmit={handleSubmit} className="space-y-2">
      <Field label="Prescription code" htmlFor="rx-code" name="code">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <MaskedInput
              id="rx-code"
              name="code"
              label="Prescription code"
              required
              rule={prescriptionCode}
              filter={(v) => v.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24)}
              placeholder="RX-00012"
              autoComplete="off"
              spellCheck={false}
              className="h-11 rounded-lg bg-card placeholder:normal-case"
            />
          </div>
          <SubmitButton className="h-11 rounded-lg px-4 shrink-0">
            Verify
            <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
          </SubmitButton>
        </div>
      </Field>
    </Form>
  );
}
