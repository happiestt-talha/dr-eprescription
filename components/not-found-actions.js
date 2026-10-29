"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!/^RX-[\dA-Z-]{3,20}$/.test(clean)) {
      setError("Enter a code like RX-00012, as printed on the prescription.");
      return;
    }
    router.push(`/verify/${encodeURIComponent(clean)}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-2">
      <Label htmlFor="rx-code" className="text-[13px] font-medium">
        Prescription code
      </Label>
      <div className="flex gap-2">
        <Input
          id="rx-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError("");
          }}
          placeholder="RX-00012"
          autoComplete="off"
          spellCheck={false}
          aria-describedby={error ? "rx-code-error" : undefined}
          aria-invalid={error ? true : undefined}
          className="h-11 rounded-lg bg-card uppercase placeholder:normal-case"
        />
        <Button type="submit" className="h-11 rounded-lg px-4 shrink-0">
          Verify
          <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
        </Button>
      </div>
      {error && (
        <p id="rx-code-error" role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
