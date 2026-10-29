"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  filterBloodPressure,
  filterCnic,
  filterCode,
  filterEmail,
  filterName,
  filterStrength,
  filterTitle,
  formatPhoneDisplay,
  formatPhoneTyping,
  isValidBloodPressure,
  isValidEmail,
  normalizeCnic,
  normalizePhonePK,
} from "@/lib/sanitize"

/**
 * The regular Input, with sanitisation as you type: every keystroke and paste
 * goes through `filter`, the value is checked on blur with `validate`, and a
 * small inline error appears below. The server re-validates everything
 * (lib/validate.js); this just stops bad input at the source.
 *
 * Uncontrolled from the outside (defaultValue + name, works in native forms).
 * `submitValue` maps the displayed value to what the form submits (e.g. a
 * formatted phone shown as 0300-1234567 submits +923001234567).
 */
function MaskedInput({
  name,
  defaultValue = "",
  filter = (v) => v,
  validate,
  submitValue,
  errorMessage = "This value isn't valid",
  required,
  className,
  onValueChange,
  ...props
}) {
  const [value, setValue] = React.useState(() => filter(String(defaultValue ?? "")))
  const [error, setError] = React.useState("")
  const errorId = React.useId()

  function check(v) {
    if (!v) return required ? "This field is required" : ""
    return validate && !validate(v) ? errorMessage : ""
  }

  return (
    <div className="space-y-1">
      <Input
        {...props}
        name={submitValue ? undefined : name}
        value={value}
        required={required}
        onChange={(e) => {
          const next = filter(e.target.value)
          setValue(next)
          onValueChange?.(next)
          if (error && !check(next)) setError("")
        }}
        onBlur={() => setError(check(value))}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={className}
      />
      {submitValue ? <input type="hidden" name={name} value={value ? submitValue(value) : ""} /> : null}
      {error ? (
        <p id={errorId} className="text-[11px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function NameInput(props) {
  return (
    <MaskedInput
      autoComplete="name"
      maxLength={80}
      filter={(v) => filterName(v).replace(/^\s+/, "").replace(/ {2,}/g, " ")}
      validate={(v) => /\p{L}/u.test(v)}
      errorMessage="Use letters only (spaces and . ' - are fine)"
      {...props}
    />
  )
}

function EmailInput(props) {
  return (
    <MaskedInput
      type="email"
      inputMode="email"
      autoComplete="email"
      autoCapitalize="none"
      spellCheck={false}
      maxLength={120}
      filter={filterEmail}
      validate={isValidEmail}
      errorMessage="Enter a valid email, e.g. name@clinic.pk"
      {...props}
    />
  )
}

/** Pakistani mobile: shown as 0300-1234567, submitted as +923001234567. */
function PhoneInput({ defaultValue = "", ...props }) {
  return (
    <MaskedInput
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      maxLength={16}
      defaultValue={defaultValue ? formatPhoneDisplay(defaultValue) : ""}
      filter={formatPhoneTyping}
      validate={(v) => Boolean(normalizePhonePK(v))}
      submitValue={(v) => normalizePhonePK(v) || v}
      errorMessage="Enter a mobile number like 0300-1234567"
      placeholder="0300-1234567"
      {...props}
    />
  )
}

function CnicInput(props) {
  return (
    <MaskedInput
      inputMode="numeric"
      maxLength={15}
      filter={filterCnic}
      validate={(v) => Boolean(normalizeCnic(v))}
      errorMessage="CNIC has 13 digits, e.g. 35202-1234567-1"
      placeholder="35202-1234567-1"
      {...props}
    />
  )
}

function CodeInput(props) {
  return (
    <MaskedInput
      autoCapitalize="characters"
      spellCheck={false}
      maxLength={40}
      filter={filterCode}
      errorMessage="Use letters, numbers, - and / only"
      {...props}
    />
  )
}

function TitleInput(props) {
  return <MaskedInput maxLength={120} filter={filterTitle} {...props} />
}

function StrengthInput(props) {
  return <MaskedInput maxLength={40} filter={filterStrength} {...props} />
}

function BloodPressureInput(props) {
  return (
    <MaskedInput
      inputMode="numeric"
      maxLength={7}
      filter={filterBloodPressure}
      validate={isValidBloodPressure}
      errorMessage="Enter as systolic/diastolic, e.g. 120/80"
      placeholder="120/80"
      {...props}
    />
  )
}

export {
  MaskedInput,
  NameInput,
  EmailInput,
  PhoneInput,
  CnicInput,
  CodeInput,
  TitleInput,
  StrengthInput,
  BloodPressureInput,
}
