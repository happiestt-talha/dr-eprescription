"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLabTest, updateLabTest, deleteLabTest } from "@/lib/actions/lab-tests";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { Field } from "@/components/ui/form-layout";
import { Form, FormStatus, SubmitButton } from "@/components/ui/form";
import { TextInput } from "@/components/ui/form-inputs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, FlaskConical } from "lucide-react";
import { DataList } from "@/components/ui/data-list";
import { StatusBadge } from "@/components/ui/status-badge";

export function LabTestsTable({ labTests, server, initial }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(labTest) {
    setEditing(labTest);
    setOpen(true);
  }

  // Validation and errors live in the dialog's <Form>; reopening starts clean.
  async function handleSubmit(formData) {
    const res = editing ? await updateLabTest(editing.id, formData) : await createLabTest(formData);
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
        const res = await deleteLabTest(id);
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
      header: "Test",
      mobile: "title",
      cell: (t) => (
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <FlaskConical className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
          {t.name}
        </span>
      ),
    },
    { key: "category", header: "Category", mobile: "badge", cell: (t) => (t.category ? <StatusBadge tone="neutral">{t.category}</StatusBadge> : "—") },
    { key: "normalRange", header: "Normal range", cell: (t) => t.normalRange || "—" },
  ];
  // Category filter from the categories actually in use.
  const categoryFilter = useMemo(() => {
    const cats = [...new Set(labTests.map((t) => t.category).filter(Boolean))].sort();
    return cats.length ? [{ key: "category", label: "Categories", options: cats.map((c) => ({ value: c, label: c })) }] : [];
  }, [labTests]);

  return (
    <div className="space-y-4">
      {deleteError && (
        <p role="alert" className="text-sm font-medium text-destructive p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          {deleteError}
        </p>
      )}
      <DataList
        rows={labTests}
        initial={initial}
        server={server}
        columns={columns}
        filters={categoryFilter}
        noun="lab tests"
        searchPlaceholder="Search test name, category or range"
        empty={{ icon: FlaskConical, title: "No lab tests yet", text: "Add the tests doctors can order on a prescription." }}
        toolbar={
          <Button onClick={openAdd} className="min-h-[44px] w-full shadow-xs sm:w-auto md:min-h-9">
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Add lab test
          </Button>
        }
        actions={(row) => (
          <>
            <Button variant="ghost" size="sm" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`} className="h-9 gap-1.5 text-xs">
              <Pencil className="size-3.5" aria-hidden="true" /> Edit
            </Button>
            <DeleteButton name={row.name} note="This can't be undone. Tests already used in a prescription can't be deleted." onConfirm={() => handleDelete(row.id)} />
          </>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
          <Form key={editing?.id ?? "new"} onSubmit={handleSubmit} keepPendingOnSuccess={false} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">{editing ? "Edit lab test" : "Add lab test"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4">
              <Field label="Test name" htmlFor="name" required>
                <TextInput id="name" name="name" label="Test name" maxLength={120} defaultValue={editing?.name || ""} required placeholder="e.g. Complete Blood Count (CBC)" className="h-11 md:h-10" />
              </Field>
              <Field label="Category" htmlFor="category">
                <TextInput id="category" name="category" maxLength={60} placeholder="e.g. Haematology" defaultValue={editing?.category || ""} className="h-11 md:h-10" />
              </Field>
              <Field label="Normal reference range" htmlFor="normalRange">
                <TextInput id="normalRange" name="normalRange" maxLength={120} placeholder="e.g. 4.5–11.0 x10⁹/L" defaultValue={editing?.normalRange || ""} className="h-11 md:h-10" />
              </Field>
            </div>

            <FormStatus variant="dialog" />

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 w-full px-5 sm:w-auto">
                Cancel
              </Button>
              <SubmitButton pendingText="Saving…" className="h-11 w-full px-6 sm:w-auto">
                {editing ? "Save changes" : "Add lab test"}
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
