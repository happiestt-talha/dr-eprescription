"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/form-error"

/**
 * Form controller: inline validation for every field, the same way everywhere.
 *
 * Each control registers itself (useFormField) with a `validate(value, ctx)`
 * that returns an error message or "". Rules come from lib/rules.js, the same
 * functions the server uses, so the browser and the server always agree.
 *
 * When errors show ("reward early, punish late"):
 * - a field is checked when you leave it; from then on it re-checks on every
 *   keystroke, so the error disappears the moment the value is fixed;
 * - on submit every field is checked, submit is blocked, focus moves to the
 *   first invalid field and a summary banner counts the problems;
 * - errors the server returns (`fieldErrors`) land on the same fields.
 *
 * `onSubmit(formData, ctx)` returns the action result. On `{ error }` the
 * form leaves the pending state; on success it stays pending (the caller is
 * usually navigating away) unless `keepPendingOnSuccess={false}`.
 */
const FormContext = React.createContext(null)

export function useFormContext() {
  return React.useContext(FormContext)
}

export function Form({ onSubmit, children, className, keepPendingOnSuccess = true, id: idProp, ...props }) {
  const autoId = React.useId()
  const formId = idProp || autoId
  const formRef = React.useRef(null)
  const fields = React.useRef(new Map())
  const [errors, setErrors] = React.useState({})
  const [touched, setTouched] = React.useState({})
  const [submitted, setSubmitted] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [summary, setSummary] = React.useState("")
  const [result, setResult] = React.useState(null)
  // Mirrors for the stable callbacks below (fields register once, not on every render).
  const touchedRef = React.useRef({})
  const submittedRef = React.useRef(false)
  const pendingRef = React.useRef(false)
  React.useEffect(() => {
    touchedRef.current = touched
    submittedRef.current = submitted
    pendingRef.current = pending
  }, [touched, submitted, pending])

  const setError = React.useCallback((name, message) => {
    setErrors((prev) => (prev[name] === message || (!prev[name] && !message) ? prev : { ...prev, [name]: message }))
  }, [])

  const runField = React.useCallback((name, value, ctx) => {
    const entry = fields.current.get(name)
    if (!entry) return ""
    return entry.validate(value === undefined ? entry.getValue() : value, ctx) || ""
  }, [])

  /** Validates every registered field; focuses the first invalid one. */
  const validate = React.useCallback(
    (ctx) => {
      const next = {}
      for (const [name] of fields.current) {
        const message = runField(name, undefined, ctx)
        if (message) next[name] = message
      }
      setErrors(next)
      submittedRef.current = true
      setSubmitted(true)
      const names = Object.keys(next)
      if (names.length) {
        setSummary("")
        // First invalid field in page order.
        const first = names
          .map((n) => ({ n, el: fields.current.get(n)?.el?.() }))
          .filter((x) => x.el)
          .sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))[0]
        first ? fields.current.get(first.n).focus() : null
        return false
      }
      setSummary("")
      return true
    },
    [runField]
  )

  /** Applies a server result: field errors inline, message in the banner. */
  const applyResult = React.useCallback((res) => {
    setResult(res ?? null)
    if (res?.fieldErrors) {
      setErrors((prev) => ({ ...prev, ...res.fieldErrors }))
      setTouched((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(res.fieldErrors).map((k) => [k, true])) }))
      const first = Object.keys(res.fieldErrors).find((n) => fields.current.has(n))
      if (first) fields.current.get(first).focus()
    }
    setSummary(res?.error || "")
  }, [])

  const submit = React.useCallback(
    async (ctx = {}) => {
      if (pendingRef.current) return
      if (!validate(ctx)) return
      pendingRef.current = true
      setPending(true)
      setSummary("")
      try {
        const formData = new FormData(formRef.current)
        const res = await onSubmit(formData, ctx)
        if (res?.error) {
          applyResult(res)
          pendingRef.current = false
          setPending(false)
        } else {
          setResult(res ?? null)
          if (!keepPendingOnSuccess) {
            pendingRef.current = false
            setPending(false)
          }
        }
        return res
      } catch {
        setSummary("Couldn't reach the server. Check your connection and try again.")
        pendingRef.current = false
        setPending(false)
      }
    },
    [validate, onSubmit, applyResult, keepPendingOnSuccess]
  )

  const register = React.useCallback((name, entry) => {
    fields.current.set(name, entry)
    return () => {
      if (fields.current.get(name) !== entry) return
      fields.current.delete(name)
      // A removed field (e.g. a deleted medicine row) takes its error with it.
      setErrors((prev) => {
        if (!(name in prev)) return prev
        const { [name]: _removed, ...rest } = prev
        return rest
      })
    }
  }, [])

  /** Call on every value change. Re-checks once the field was touched or the form submitted. */
  const changed = React.useCallback(
    (name, value) => {
      // A server message is about the last attempt; editing starts a new one.
      setSummary("")
      if (touchedRef.current[name] || submittedRef.current) setError(name, runField(name, value))
      else setError(name, "")
    },
    [runField, setError]
  )

  /** Call on blur: marks touched and checks. */
  const blurred = React.useCallback(
    (name, value) => {
      touchedRef.current = { ...touchedRef.current, [name]: true }
      setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }))
      setError(name, runField(name, value))
    },
    [runField, setError]
  )

  const errorId = React.useCallback((name) => `${formId}-${String(name).replace(/[^\w-]/g, "_")}-error`, [formId])

  const ctx = React.useMemo(
    () => ({ formId, errors, pending, summary, submitted, result, validate, submit, setError, errorId, register, changed, blurred }),
    [formId, errors, pending, summary, submitted, result, validate, submit, setError, errorId, register, changed, blurred]
  )

  return (
    <FormContext.Provider value={ctx}>
      <form
        ref={formRef}
        id={formId}
        noValidate
        className={className}
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        {...props}>
        {children}
      </form>
    </FormContext.Provider>
  )
}

/**
 * Connects a control to the surrounding <Form>. `validate(value, ctx)` returns
 * a message or ""; `getValue()` returns the current value (for submit-time
 * checks). Returns handlers to call on change/blur and the error to show.
 * Outside a <Form> it's inert (error is always "").
 */
export function useFormField(name, { validate, getValue }) {
  const form = React.useContext(FormContext)
  const elRef = React.useRef(null)
  const latest = React.useRef({ validate, getValue })
  React.useEffect(() => {
    latest.current = { validate, getValue }
  })
  // Callback ref, so the element is known without reading refs during render.
  const attach = React.useCallback((el) => {
    elRef.current = el
  }, [])
  const register = form?.register

  React.useEffect(() => {
    if (!register || !name) return
    return register(name, {
      validate: (value, ctx) => latest.current.validate?.(value, ctx) || "",
      getValue: () => latest.current.getValue?.(),
      focus: () => {
        const el = elRef.current
        if (!el) return
        el.focus?.({ preventScroll: true })
        el.scrollIntoView?.({ block: "center", behavior: "smooth" })
      },
      el: () => elRef.current,
    })
  }, [register, name])

  const error = (form && name && form.errors[name]) || ""
  return {
    attach,
    error,
    errorId: form && name ? form.errorId(name) : undefined,
    inForm: Boolean(form && name),
    changed: (value) => form && name && form.changed(name, value),
    blurred: (value) => form && name && form.blurred(name, value),
  }
}

/** The error under a field (used by <Field name>). */
export function FieldErrorText({ name, className }) {
  const form = React.useContext(FormContext)
  const error = form?.errors[name]
  return (
    <p id={form ? form.errorId(name) : undefined} aria-live="polite" className={cn("text-xs font-medium text-destructive empty:hidden", className)}>
      {error || ""}
    </p>
  )
}

/**
 * Summary banner. After a blocked submit it counts the fields still invalid
 * (live, so it shrinks as you fix them and disappears at zero); otherwise it
 * shows the server's message.
 */
export function FormStatus({ action, variant = "page" }) {
  const form = React.useContext(FormContext)
  if (!form) return null
  const open = Object.values(form.errors).filter(Boolean).length
  const message = form.summary || (form.submitted && open ? (open === 1 ? "1 field needs attention" : `${open} fields need attention`) : "")
  if (!message) return null
  return (
    <FormError variant={variant} action={typeof action === "function" ? action(form.result) : action}>
      {message}
    </FormError>
  )
}

/** Submit button wired to the form's pending state. */
export function SubmitButton({ children, pendingText, disabled, className, ...props }) {
  const form = React.useContext(FormContext)
  const pending = form?.pending
  return (
    <Button type="submit" disabled={pending || disabled} className={className} {...props}>
      {pending && pendingText ? pendingText : children}
    </Button>
  )
}
