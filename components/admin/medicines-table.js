"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMedicine, updateMedicine, deleteMedicine } from "@/lib/actions/medicines";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Pill, Building } from "lucide-react";

const dosageForms = ["tablet", "syrup", "injection", "capsule", "cream", "drops", "other"];

export function MedicinesTable({ medicines }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = add mode
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setEditing(null);
    setError("");
    setOpen(true);
  }

  function openEdit(medicine) {
    setEditing(medicine);
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.target);

    startTransition(async () => {
      const res = editing
        ? await updateMedicine(editing.id, formData)
        : await createMedicine(formData);

      if (res?.error) {
        setError(res.error);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete(id) {
    startTransition(async () => {
      await deleteMedicine(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="w-full sm:w-auto min-h-[44px] shadow-xs">
          <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
          Add Medicine
        </Button>
      </div>

      {/* Mobile Card View (below md: 768px) */}
      <div className="md:hidden space-y-3">
        {medicines.map((med) => (
          <div key={med.id} className="border border-border/60 rounded-xl p-4 bg-card space-y-3 shadow-xs">
            {/* Primary identifying info prominently at top */}
            <div className="border-b pb-2.5 flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-base text-foreground flex items-center gap-1.5">
                  <Pill className="h-4 w-4 text-primary shrink-0" strokeWidth={1.75} />
                  {med.name}
                </h2>
                {med.genericName && (
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{med.genericName}</p>
                )}
              </div>
              {med.dosageForm && (
                <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium bg-muted text-muted-foreground">
                  {med.dosageForm}
                </span>
              )}
            </div>

            {/* Stacked Label: Value lines */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Strength:</span>
                <span className="font-medium text-foreground">{med.strength || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Manufacturer:</span>
                <span className="font-medium text-foreground">{med.manufacturer || "—"}</span>
              </div>
            </div>

            {/* Row-level actions at bottom of card */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(med)}
                className="min-h-[44px] px-3 flex items-center gap-1.5 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Edit</span>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "min-h-[44px] px-3 text-destructive hover:text-destructive hover:bg-destructive/10 flex items-center gap-1.5 text-xs"
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Delete</span>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {med.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Medicines already used in a prescription cannot be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto min-h-[44px]">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(med.id)} className="w-full sm:w-auto min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
        {medicines.length === 0 && (
          <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl bg-card">
            <Pill className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="font-medium text-foreground">No medicines found</p>
            <p className="text-xs text-muted-foreground mt-1">Add medicines to the clinic formulary to begin prescribing.</p>
          </div>
        )}
      </div>

      {/* Desktop & Tablet Table View (md: 768px+) */}
      <div className="hidden md:block border border-border/60 rounded-xl overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Brand Name</TableHead>
              <TableHead>Generic Name</TableHead>
              <TableHead>Form</TableHead>
              <TableHead>Strength</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicines.map((med) => (
              <TableRow key={med.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-semibold text-foreground">{med.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{med.genericName || "—"}</TableCell>
                <TableCell className="capitalize">
                  {med.dosageForm ? (
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-muted/80 text-muted-foreground">
                      {med.dosageForm}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell>{med.strength || "—"}</TableCell>
                <TableCell>{med.manufacturer || "—"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(med)} className="min-h-[36px] min-w-[36px] hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Pencil className="h-4 w-4" strokeWidth={1.75} />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "min-h-[36px] min-w-[36px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      )}
                      aria-label={`Delete ${med.name}`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {med.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Medicines already used in a prescription cannot be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(med.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {medicines.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                  <Pill className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
                  <p className="font-medium text-foreground">No medicines found</p>
                  <p className="text-xs text-muted-foreground mt-1">Add medicines to the clinic formulary to begin prescribing.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{editing ? "Edit Medicine" : "Add Medicine"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="name">Brand Name</Label>
              <Input id="name" name="name" defaultValue={editing?.name || ""} required placeholder="e.g., Augmentin" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genericName">Generic Name</Label>
              <Input id="genericName" name="genericName" defaultValue={editing?.genericName || ""} placeholder="e.g., Co-amoxiclav" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosageForm">Dosage Form</Label>
              <Select name="dosageForm" defaultValue={editing?.dosageForm || undefined}>
                <SelectTrigger id="dosageForm">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="strength">Strength / Concentration</Label>
              <Input id="strength" name="strength" placeholder="e.g., 625mg, 125mg/5ml" defaultValue={editing?.strength || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer / Pharma Company</Label>
              <Input id="manufacturer" name="manufacturer" defaultValue={editing?.manufacturer || ""} placeholder="e.g., GSK" />
            </div>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto min-h-[44px]">
                {isPending ? "Saving..." : editing ? "Save Changes" : "Add Medicine"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}