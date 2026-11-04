"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMedicine, updateMedicine, deleteMedicine } from "@/lib/actions/medicines";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { Field } from "@/components/ui/form-layout";
import { Form, FormStatus, SubmitButton } from "@/components/ui/form";
import { StrengthInput, TextInput } from "@/components/ui/form-inputs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Pill } from "lucide-react";
import { DataList } from "@/components/ui/data-list";
import { StatusBadge } from "@/components/ui/status-badge";

const dosageForms = ["tablet", "syrup", "injection", "capsule", "cream", "drops", "inhaler", "other"];
const DOSAGE_FORM_LABELS = Object.fromEntries(dosageForms.map((f) => [f, f[0].toUpperCase() + f.slice(1)]));
const FILTERS = [{ key: "dosageForm", label: "Dosage forms", options: dosageForms.map((f) => ({ value: f, label: DOSAGE_FORM_LABELS[f] })) }];

export function MedicinesTable({ medicines, server, initial }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = add mode
  const [deleteError, setDeleteError] = useState("");
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(medicine) {
    setEditing(medicine);
    setOpen(true);
  }

  // Validation and errors live in the dialog's <Form>; reopening starts clean.
  async function handleSubmit(formData) {
    const res = editing ? await updateMedicine(editing.id, formData) : await createMedicine(formData);
    if (!res?.error) {
      setOpen(false);
      router.refresh();
    }
    return res;
  }

  function handleDelete(id) {
    setDeleteError("");
    startTransition(async () => {
      try {
        const res = await deleteMedicine(id);
        if (res?.error) {
          setDeleteError(res.error);
          return;
        }
        router.refresh();
      } catch {
        setDeleteError("Couldn't reach the server. Check your connection and try again.");
      }
    });
  }

  const columns = [
    {
      key: "name",
      header: "Brand name",
      mobile: "title",
      cell: (m) => (
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <Pill className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
          {m.name}
        </span>
      ),
    },
    { key: "genericName", header: "Generic name", mobile: "subtitle", cell: (m) => m.genericName || "—" },
    { key: "dosageForm", header: "Form", mobile: "badge", className: "capitalize", cell: (m) => (m.dosageForm ? <StatusBadge tone="neutral">{m.dosageForm}</StatusBadge> : "—") },
    { key: "strength", header: "Strength", cell: (m) => m.strength || "—" },
    { key: "manufacturer", header: "Manufacturer", className: "hidden lg:table-cell", cell: (m) => m.manufacturer || "—" },
  ];

  return (
    <div className="space-y-4">
      {deleteError && (
        <p role="alert" className="text-sm font-medium text-destructive p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          {deleteError}
        </p>
      )}
      <DataList
        rows={medicines}
        initial={initial}
        server={server}
        columns={columns}
        filters={FILTERS}
        noun="medicines"
        searchPlaceholder="Search brand, generic name, form, strength or maker"
        empty={{ icon: Pill, title: "No medicines yet", text: "Add medicines to the clinic formulary to begin prescribing." }}
        toolbar={
          <Button onClick={openAdd} className="min-h-[44px] w-full shadow-xs sm:w-auto md:min-h-9">
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Add medicine
          </Button>
        }
        actions={(row) => (
          <>
            <Button variant="ghost" size="sm" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`} className="h-9 gap-1.5 text-xs">
              <Pencil className="size-3.5" aria-hidden="true" /> Edit
            </Button>
            <DeleteButton name={row.name} note="This can't be undone. Medicines already used in a prescription can't be deleted." onConfirm={() => handleDelete(row.id)} />
          </>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-xl">
          <Form key={editing?.id ?? "new"} onSubmit={handleSubmit} keepPendingOnSuccess={false} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">{editing ? "Edit medicine" : "Add medicine"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Brand name" htmlFor="name" required span="full">
                <TextInput id="name" name="name" label="Brand name" maxLength={120} defaultValue={editing?.name || ""} required placeholder="e.g. Augmentin" className="h-11 md:h-10" />
              </Field>
              <Field label="Generic name" htmlFor="genericName" span="full">
                <TextInput id="genericName" name="genericName" maxLength={120} defaultValue={editing?.genericName || ""} placeholder="e.g. Co-amoxiclav" className="h-11 md:h-10" />
              </Field>
              <Field label="Dosage form" htmlFor="dosageForm">
                <Select name="dosageForm" defaultValue={editing?.dosageForm || undefined} items={DOSAGE_FORM_LABELS}>
                  <SelectTrigger id="dosageForm" className="h-11 w-full md:h-10">
                    <SelectValue placeholder="Select a form" />
                  </SelectTrigger>
                  <SelectContent>
                    {dosageForms.map((f) => (
                      <SelectItem key={f} value={f} className="capitalize">
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Strength" htmlFor="strength">
                <StrengthInput id="strength" name="strength" placeholder="e.g. 625mg" defaultValue={editing?.strength || ""} className="h-11 md:h-10" />
              </Field>
              <Field label="Manufacturer" htmlFor="manufacturer" span="full">
                <TextInput id="manufacturer" name="manufacturer" maxLength={120} defaultValue={editing?.manufacturer || ""} placeholder="e.g. GSK" className="h-11 md:h-10" />
              </Field>
            </div>

            <FormStatus variant="dialog" />

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 w-full px-5 sm:w-auto">
                Cancel
              </Button>
              <SubmitButton pendingText="Saving…" className="h-11 w-full px-6 sm:w-auto">
                {editing ? "Save changes" : "Add medicine"}
              </SubmitButton>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Delete with a confirmation step. */
function DeleteButton({ name, note, onConfirm }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        aria-label={`Delete ${name}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-9 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive")}>
        <Trash2 className="size-3.5" aria-hidden="true" /> Delete
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>{note}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <AlertDialogCancel className="min-h-[44px] w-full sm:w-auto">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="min-h-[44px] w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
