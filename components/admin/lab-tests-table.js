"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLabTest, updateLabTest, deleteLabTest } from "@/lib/actions/lab-tests";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

export function LabTestsTable({ labTests }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setEditing(null);
    setError("");
    setOpen(true);
  }

  function openEdit(labTest) {
    setEditing(labTest);
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.target);

    startTransition(async () => {
      const res = editing
        ? await updateLabTest(editing.id, formData)
        : await createLabTest(formData);

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
      await deleteLabTest(id);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openAdd} className="w-full sm:w-auto min-h-[44px]">
          <Plus className="mr-2 h-4 w-4" />
          Add Lab Test
        </Button>
      </div>

      {/* Mobile Card View (below md: 768px) */}
      <div className="md:hidden space-y-3">
        {labTests.map((test) => (
          <div key={test.id} className="border rounded-lg p-4 bg-card space-y-3 shadow-xs">
            {/* Primary identifying info prominently at top */}
            <div className="border-b pb-2.5">
              <h2 className="font-semibold text-base text-foreground">{test.name}</h2>
            </div>

            {/* Stacked Label: Value lines */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium text-foreground">{test.category || "General"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Normal Range:</span>
                <span className="font-medium text-foreground">{test.normalRange || "—"}</span>
              </div>
            </div>

            {/* Row-level actions at bottom of card */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(test)}
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
                    <AlertDialogTitle>Delete {test.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This can&apos;t be undone. Tests already used in a prescription can&apos;t be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto min-h-[44px]">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(test.id)} className="w-full sm:w-auto min-h-[44px]">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
        {labTests.length === 0 && (
          <div className="text-center text-muted-foreground py-8 border rounded-lg bg-card">
            No lab tests yet. Add the first one to get started.
          </div>
        )}
      </div>

      {/* Desktop & Tablet Table View (md: 768px+) */}
      <div className="hidden md:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Normal Range</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labTests.map((test) => (
              <TableRow key={test.id}>
                <TableCell className="font-medium">{test.name}</TableCell>
                <TableCell>{test.category || "—"}</TableCell>
                <TableCell>{test.normalRange || "—"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(test)} className="min-h-[44px] min-w-[44px]">
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "min-h-[44px] min-w-[44px]"
                      )}
                      aria-label={`Delete ${test.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {test.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This can&apos;t be undone. Tests already used in a prescription can&apos;t be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(test.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {labTests.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No lab tests yet. Add the first one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Lab Test" : "Add Lab Test"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={editing?.name || ""} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="Blood, Imaging, Cardiac..."
                defaultValue={editing?.category || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="normalRange">Normal Range</Label>
              <Input
                id="normalRange"
                name="normalRange"
                placeholder="e.g. 4.5–11.0 x10⁹/L"
                defaultValue={editing?.normalRange || ""}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto min-h-[44px]">
                {isPending ? "Saving..." : editing ? "Save Changes" : "Add Lab Test"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}