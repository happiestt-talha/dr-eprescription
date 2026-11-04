"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useFormField } from "@/components/ui/form"
import * as rules from "@/lib/rules"
import { LIMITS } from "@/lib/rules"
import {
  MEASURES,
  bloodPressureWarning,
  celsiusToFahrenheit,
  checkMeasure,
  feetToCm,
  filterCnic,
  filterCode,
  filterEmail,
  filterMeasure,
  filterName,
  filterStrength,
  filterTitle,
  formatBloodPressure,
  formatPhoneDisplay,
  formatPhoneTyping,
  normalizePhonePK,
  tidyNameCase,
} from "@/lib/sanitize"

/** Props win over defaults only when actually set (`maxLength={undefined}` keeps the default). */
function withDefaults(defaults, props) {
  const out = { ...defaults }
  for (const [k, v] of Object.entries(props)) if (v !== undefined) out[k] = v
  return out
}

/** aria wiring shared by every control. */
function ariaFor(field, describedBy) {
  return {
    "aria-invalid": field.error ? true : undefined,
    "aria-describedby": [describedBy, field.error ? field.errorId : null].filter(Boolean).join(" ") || undefined,
  }
}

/** Small note under a control: amber warning, or a one-click fix. */
function Note({ tone = "warn", children }) {
  return <p className={cn("text-xs", tone === "warn" ? "text-warning-strong" : "text-muted-foreground")}>{children}</p>
}

/**
 * Input with sanitisation as you type and inline validation.
 *
 * - `filter(next, prev)` cleans every keystroke and paste; return `prev` to
 *   refuse it, and `rejectMessage` (string or (raw, next, prev) => string)
 *   explains why, right away.
 * - `rule` is a lib/rules.js rule (`ruleOptions` adds options like a label);
 *   `required` is passed to it. Inside a <Form>, errors show under the field
 *   (via <Field name>), first on blur and then live as you type.
 * - `warn(value)`: amber "double-check" note (on blur); `assist(value)`:
 *   { text, label, value } one-click fix; `blurFormat(value)`: tidy-up on
 *   leaving; `unit`: shown inside on the right.
 * - `submitValue` maps the shown value to what is submitted (phone shown as
 *   0300-1234567 submits +923001234567).
 *
 * Uncontrolled from the outside (defaultValue + name), so native FormData works.
 */
function MaskedInput({
  name,
  defaultValue = "",
  filter = (v) => v,
  rule,
  ruleOptions,
  validate,
  submitValue,
  rejectMessage,
  warn,
  assist,
  blurFormat,
  unit,
  required,
  label,
  className,
  onValueChange,
  onBlur,
  "aria-describedby": describedBy,
  ...props
}) {
  const [value, setValue] = React.useState(() => filter(String(defaultValue ?? ""), ""))
  const [reject, setReject] = React.useState("")
  const [warning, setWarning] = React.useState("")
  const [touched, setTouched] = React.useState(false)
  const noteId = React.useId()

  const check = (v) => {
    if (rule) {
      const { error } = rule(v, { required, ...(label ? { label } : {}), ...ruleOptions })
      if (error) return error
    } else if (!v && required) {
      return `${label || "This field"} is required`
    }
    return (v && validate?.(v)) || ""
  }
  const { attach: fieldRef, ...field } = useFormField(name, { validate: (v) => check(v ?? value), getValue: () => value })

  function commit(next) {
    setValue(next)
    onValueChange?.(next)
    field.changed(next)
  }

  const help = touched && assist && value ? assist(value) : null
  const note = !field.error && (reject || (touched && warning))

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          {...props}
          ref={fieldRef}
          name={submitValue ? undefined : name}
          value={value}
          required={required}
          onChange={(e) => {
            const raw = e.target.value
            const next = filter(raw, value)
            // Explain dropped characters (e.g. digits in a name) instead of ignoring them silently.
            // Only when something was removed beyond the filter's own spacing/format cleanup.
            const strip = (x) => String(x).replace(/[\s\-/]/g, "")
            const dropped = strip(next) !== strip(raw) && raw.length >= value.length
            const message = typeof rejectMessage === "function" ? rejectMessage(raw, next, value) : rejectMessage
            setReject(message && dropped ? message : "")
            setWarning("")
            commit(next)
          }}
          onBlur={(e) => {
            const tidy = blurFormat && value ? blurFormat(value) : value
            if (tidy !== value) {
              setValue(tidy)
              onValueChange?.(tidy)
            }
            setReject("")
            setWarning(tidy && !check(tidy) && warn ? warn(tidy) : "")
            setTouched(true)
            field.blurred(tidy)
            onBlur?.(e)
          }}
          {...ariaFor(field, [describedBy, note || help ? noteId : null].filter(Boolean).join(" "))}
          className={cn(unit && (unit.length > 2 ? "pr-14" : "pr-10"), className)}
        />
        {unit && (
          <span className="pointer-events-none absolute top-0 right-3 flex h-full max-h-11 items-center text-xs font-medium text-muted-foreground" aria-hidden="true">
            {unit}
          </span>
        )}
      </div>
      {submitValue ? <input type="hidden" name={name} value={value ? submitValue(value) : ""} /> : null}
      {(note || help) && (
        <div id={noteId} className="space-y-0.5">
          {note ? <Note tone={reject ? "info" : "warn"}>{note}</Note> : null}
          {help ? (
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              {help.text}
              <button
                type="button"
                onClick={() => {
                  commit(help.value)
                  setWarning(warn ? warn(help.value) : "")
                }}
                className="rounded font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                {help.label}
              </button>
            </p>
          ) : null}
        </div>
      )}
      {/* Outside a <Form>, show the error here. */}
      {!field.inForm && touched && check(value) ? <p className="text-xs font-medium text-destructive">{check(value)}</p> : null}
    </div>
  )
}

function NameInput(props) {
  return (
    <MaskedInput
      {...withDefaults(
        {
          autoComplete: "name",
          maxLength: LIMITS.name,
          filter: (v) => filterName(v).replace(/^\s+/, "").replace(/ {2,}/g, " "),
          rule: rules.personName,
          rejectMessage: "Names can't contain numbers or symbols",
          blurFormat: (v) => tidyNameCase(v.trim()),
        },
        props
      )}
    />
  )
}

function EmailInput(props) {
  return (
    <MaskedInput
      {...withDefaults(
        {
          type: "email",
          inputMode: "email",
          autoComplete: "email",
          autoCapitalize: "none",
          spellCheck: false,
          maxLength: LIMITS.email,
          filter: filterEmail,
          rule: rules.email,
        },
        props
      )}
    />
  )
}

/** Pakistani mobile: shown as 0300-1234567, submitted as +923001234567. */
function PhoneInput({ defaultValue = "", ...props }) {
  return (
    <MaskedInput
      {...withDefaults(
        {
          type: "tel",
          inputMode: "tel",
          autoComplete: "tel",
          maxLength: 16,
          placeholder: "0300-1234567",
          // Local mobiles are 03XX…; "00" is the start of 0092.
          filter: (next, prev) => {
            const v = formatPhoneTyping(next)
            return /^0[^03]/.test(v) ? prev : v
          },
          rejectMessage: "Pakistani mobile numbers start with 03",
          rule: rules.phonePK,
          submitValue: (v) => normalizePhonePK(v) || v,
        },
        props
      )}
      defaultValue={defaultValue ? formatPhoneDisplay(defaultValue) : ""}
    />
  )
}

function CnicInput(props) {
  return (
    <MaskedInput
      {...withDefaults(
        {
          inputMode: "numeric",
          maxLength: 15,
          placeholder: "35202-1234567-1",
          filter: (next, prev) => (/^[089]/.test(next.replace(/\D/g, "")) ? prev : filterCnic(next)),
          rejectMessage: (raw) => (/^[089]/.test(raw.replace(/\D/g, "")) ? "A CNIC starts with a digit from 1 to 7" : ""),
          rule: rules.cnic,
        },
        props
      )}
    />
  )
}

function CodeInput(props) {
  return (
    <MaskedInput
      {...withDefaults(
        { autoCapitalize: "characters", spellCheck: false, maxLength: LIMITS.code, filter: filterCode, rule: rules.code, rejectMessage: "Letters, numbers, - and / only" },
        props
      )}
    />
  )
}

function TitleInput(props) {
  return <MaskedInput {...withDefaults({ maxLength: LIMITS.title, filter: filterTitle, rule: rules.title }, props)} />
}

function StrengthInput(props) {
  return <MaskedInput {...withDefaults({ maxLength: LIMITS.strength, filter: filterStrength, rule: rules.strength }, props)} />
}

function BloodPressureInput(props) {
  return (
    <MaskedInput
      {...withDefaults(
        {
          inputMode: "numeric",
          maxLength: 7,
          placeholder: "120/80",
          unit: "mmHg",
          filter: formatBloodPressure,
          rule: rules.bloodPressure,
          warn: bloodPressureWarning,
        },
        props
      )}
    />
  )
}

/**
 * Number with a fixed unit and range from MEASURES (lib/sanitize.js):
 * impossible values can't be typed, out-of-range ones are flagged, unusual
 * ones get an amber note. Height offers a feet -> cm fix, temperature a
 * °C -> °F fix. `extraWarn(value)` adds a context check (e.g. BMI).
 */
function MeasureInput({ measure, extraWarn, ...props }) {
  const spec = MEASURES[measure]
  const assist =
    measure === "heightCm"
      ? (v) => {
          const cm = feetToCm(v)
          const m = /^(\d)(?:\.(\d{1,2}))?$/.exec(v)
          return cm && m ? { text: `Looks like ${m[1]} ft ${m[2] || 0} in.`, label: `Use ${cm} cm`, value: String(cm) } : null
        }
      : measure === "temperatureF"
        ? (v) => {
            const n = Number(v)
            return n >= 34 && n <= 43 ? { text: "Looks like °C.", label: `Convert to ${celsiusToFahrenheit(n)} °F`, value: String(celsiusToFahrenheit(n)) } : null
          }
        : undefined
  return (
    <MaskedInput
      {...withDefaults(
        {
          inputMode: spec.decimals ? "decimal" : "numeric",
          autoComplete: "off",
          maxLength: String(spec.max).length + (spec.decimals ? spec.decimals + 1 : 0),
          // Height also accepts 5'8" style input while typing; it converts on blur.
          filter: (next, prev) =>
            measure === "heightCm" && /^\d\s*['"ft ]/.test(next) ? next.replace(/[^\d'" ft]/g, "").slice(0, 8) : filterMeasure(next, spec, prev),
          rejectMessage: (raw) =>
            Number(raw.replace(/[^\d.]/g, "")) > spec.max
              ? `${spec.label} can't be more than ${spec.max} ${spec.unit}`
              : spec.decimals
                ? `Numbers only, up to ${spec.decimals} decimal place`
                : "Whole numbers only",
          blurFormat: measure === "heightCm" ? (v) => (/['"f ]/.test(v) ? String(feetToCm(v) ?? v) : v) : undefined,
          rule: rules.measure,
          ruleOptions: { measure },
          warn: (v) => checkMeasure(v, spec)?.warning || extraWarn?.(v) || "",
          assist,
          unit: spec.unit,
        },
        props
      )}
    />
  )
}

/**
 * Plain text (single line) with the shared `text` rule: required, max length,
 * and a counter once you're close to the limit. Controlled or uncontrolled.
 */
function TextInput({ name, label, required, maxLength = LIMITS.shortText, minLength, defaultValue = "", value: controlled, onValueChange, validate, className, "aria-describedby": describedBy, ...props }) {
  const [inner, setInner] = React.useState(String(defaultValue ?? ""))
  const value = controlled !== undefined ? controlled : inner
  const check = (v) =>
    rules.text(v, { label: label || "This field", required, max: maxLength, min: minLength || 0 }).error || (v && validate?.(v)) || ""
  const { attach: fieldRef, ...field } = useFormField(name, { validate: (v) => check(v ?? value), getValue: () => value })
  return (
    <div className="space-y-1">
      <Input
        {...props}
        ref={fieldRef}
        name={name}
        value={value}
        maxLength={maxLength}
        required={required}
        onChange={(e) => {
          setInner(e.target.value)
          onValueChange?.(e.target.value)
          field.changed(e.target.value)
        }}
        onBlur={(e) => {
          field.blurred(e.target.value)
          props.onBlur?.(e)
        }}
        {...ariaFor(field, describedBy)}
        className={className}
      />
      <Counter value={value} max={maxLength} />
    </div>
  )
}

/** Multi-line text with the `text` rule (newlines kept) and a counter near the limit. */
function TextArea({ name, label, required, maxLength = LIMITS.note, defaultValue = "", validate, className, "aria-describedby": describedBy, ...props }) {
  const [value, setValue] = React.useState(String(defaultValue ?? ""))
  // `validate(value, ctx)` can add context rules (e.g. diagnosis required when finalising).
  const check = (v, ctx) =>
    rules.text(v, { label: label || "This field", required, max: maxLength, multiline: true }).error || (v !== undefined && validate?.(v, ctx)) || ""
  const { attach: fieldRef, ...field } = useFormField(name, { validate: (v, ctx) => check(v ?? value, ctx), getValue: () => value })
  return (
    <div className="space-y-1">
      <Textarea
        {...props}
        ref={fieldRef}
        id={props.id ?? name}
        name={name}
        value={value}
        maxLength={maxLength}
        required={required}
        onChange={(e) => {
          setValue(e.target.value)
          field.changed(e.target.value)
        }}
        onBlur={(e) => field.blurred(e.target.value)}
        {...ariaFor(field, describedBy)}
        className={className}
      />
      <Counter value={value} max={maxLength} />
    </div>
  )
}

/** "1,840 / 2,000" once 80% of the limit is used. */
function Counter({ value, max }) {
  const length = String(value ?? "").length
  if (!max || length < max * 0.8) return null
  return (
    <p className={cn("text-right text-xs tabular-nums", length >= max ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
      {length.toLocaleString("en-GB")} / {max.toLocaleString("en-GB")}
    </p>
  )
}

/**
 * Password with show/hide toggle. `rule`: full password rule (length) for new
 * passwords; `requiredOnly` for sign-in and "current password" fields.
 */
function PasswordInput({ name, label = "Password", required = true, requiredOnly = false, validate, className, "aria-describedby": describedBy, onValueChange, ...props }) {
  const [value, setValue] = React.useState("")
  const [shown, setShown] = React.useState(false)
  const check = (v) => rules.password(v, { label, required, min: requiredOnly ? 1 : LIMITS.password.min }).error || (v && validate?.(v)) || ""
  const { attach: fieldRef, ...field } = useFormField(name, { validate: (v) => check(v ?? value), getValue: () => value })
  return (
    <div className="relative">
      <Input
        {...props}
        ref={fieldRef}
        name={name}
        type={shown ? "text" : "password"}
        value={value}
        maxLength={LIMITS.password.max}
        required={required}
        onChange={(e) => {
          setValue(e.target.value)
          onValueChange?.(e.target.value)
          field.changed(e.target.value)
        }}
        onBlur={(e) => field.blurred(e.target.value)}
        {...ariaFor(field, describedBy)}
        className={cn("pr-16", className)}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-pressed={shown}
        aria-label={shown ? "Hide password" : "Show password"}
        className="absolute top-0 right-1 flex h-11 items-center rounded px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:h-10">
        {shown ? "Hide" : "Show"}
      </button>
    </div>
  )
}

/**
 * Pill-style single choice on native radios (keyboard works out of the box).
 * `options` is [{ value, label }]. Validates `required` inline in a <Form>.
 */
function ChoiceGroup({ name, options, defaultValue, value: controlled, onValueChange, required, label, className, size = "default" }) {
  const groupId = React.useId()
  const [inner, setInner] = React.useState(defaultValue ?? "")
  const value = controlled !== undefined ? controlled : inner
  const check = (v) => (required && !v ? `Choose ${label ? label.toLowerCase() : "an option"}` : "")
  const { attach: fieldRef, ...field } = useFormField(name, { validate: (v) => check(v ?? value), getValue: () => value })
  return (
    <div
      ref={fieldRef}
      role="radiogroup"
      aria-label={label}
      aria-required={required || undefined}
      aria-invalid={field.error ? true : undefined}
      aria-describedby={field.error ? field.errorId : undefined}
      tabIndex={-1}
      className={cn("flex flex-wrap gap-2 rounded-full outline-none", className)}>
      {options.map((o, i) => {
        const id = `${groupId}-${i}`
        return (
          <label key={o.value} htmlFor={id} className="relative cursor-pointer">
            <input
              id={id}
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => {
                setInner(o.value)
                onValueChange?.(o.value)
                field.changed(o.value)
                field.blurred(o.value)
              }}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex select-none items-center justify-center gap-1.5 rounded-full border bg-background font-medium text-foreground transition-all hover:border-primary/50 hover:bg-primary/5 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:shadow-sm peer-checked:shadow-primary/25 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 dark:bg-input/30",
                field.error ? "border-destructive" : "border-input",
                size === "sm" ? "h-9 min-w-11 px-3 text-xs" : "h-11 min-w-16 px-4 text-sm md:h-10"
              )}>
              {o.icon}
              {o.label}
            </span>
          </label>
        )
      })}
    </div>
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
  MeasureInput,
  TextInput,
  TextArea,
  PasswordInput,
  ChoiceGroup,
}
