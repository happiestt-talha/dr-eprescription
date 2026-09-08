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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

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
    <>
      <div className="flex justify-end">
        <Button onClick={openAdd} className="w-full sm:w-auto min-h-[44px]">
          <Plus className="mr-2 h-4 w-4" />
          Add Medicine
        </Button>
      </div>

      {/* Mobile Card View (below md: 768px) */}
      <div className="md:hidden space-y-3">
        {medicines.map((med) => (
          <div key={med.id} className="border rounded-lg p-4 bg-card space-y-3 shadow-xs">
            {/* Primary identifying info prominently at top */}
            <div className="border-b pb-2.5">
              <h2 className="font-semibold text-base text-foreground">{med.name}</h2>
            </div>

            {/* Stacked Label: Value lines */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Generic Name:</span>
                <span className="font-medium text-foreground">{med.genericName || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dosage Form:</span>
                <span className="font-medium capitalize text-foreground">{med.dosageForm || "—"}</span>
              </div>
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
                className="min-h-[44px] px-3 flex items-center gap-1.5"
              >
                <Pencil className="h-4 w-4" />
                <span className="text-xs">Edit</span>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "min-h-[44px] px-3 text-destructive hover:text-destructive flex items-center gap-1.5"
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-xs">Delete</span>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {med.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This can&apos;t be undone. Medicines already used in a prescription can&apos;t be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto min-h-[44px]">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(med.id)} className="w-full sm:w-auto min-h-[44px]">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
        {medicines.length === 0 && (
          <div className="text-center text-muted-foreground py-8 border rounded-lg bg-card">
            No medicines yet. Add the first one to get started.
          </div>
        )}
      </div>

      {/* Desktop & Tablet Table View (md: 768px+) */}
      <div className="hidden md:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Generic Name</TableHead>
              <TableHead>Form</TableHead>
              <TableHead>Strength</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicines.map((med) => (
              <TableRow key={med.id}>
                <TableCell className="font-medium">{med.name}</TableCell>
                <TableCell>{med.genericName || "—"}</TableCell>
                <TableCell className="capitalize">{med.dosageForm || "—"}</TableCell>
                <TableCell>{med.strength || "—"}</TableCell>
                <TableCell>{med.manufacturer || "—"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(med)} className="min-h-[44px] min-w-[44px]">
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "min-h-[44px] min-w-[44px]"
                      )}
                      aria-label={`Delete ${med.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {med.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This can&apos;t be undone. Medicines already used in a prescription can&apos;t be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(med.id)}>
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
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No medicines yet. Add the first one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Medicine" : "Add Medicine"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={editing?.name || ""} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genericName">Generic Name</Label>
              <Input id="genericName" name="genericName" defaultValue={editing?.genericName || ""} />
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
              <Label htmlFor="strength">Strength</Label>
              <Input id="strength" name="strength" placeholder="500mg" defaultValue={editing?.strength || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input id="manufacturer" name="manufacturer" defaultValue={editing?.manufacturer || ""} />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto min-h-[44px]">
                {isPending ? "Saving..." : editing ? "Save Changes" : "Add Medicine"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}