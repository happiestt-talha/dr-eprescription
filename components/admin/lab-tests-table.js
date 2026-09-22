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
import { Plus, Pencil, Trash2, FlaskConical, Tag } from "lucide-react";

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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="w-full sm:w-auto min-h-[44px] shadow-xs">
          <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
          Add Lab Test
        </Button>
      </div>

      {/* Mobile Card View (below md: 768px) */}
      <div className="md:hidden space-y-3">
        {labTests.map((test) => (
          <div key={test.id} className="border border-border/60 rounded-xl p-4 bg-card space-y-3 shadow-xs">
            {/* Primary identifying info prominently at top */}
            <div className="border-b pb-2.5 flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-base text-foreground flex items-center gap-1.5">
                  <FlaskConical className="h-4 w-4 text-primary shrink-0" strokeWidth={1.75} />
                  {test.name}
                </h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium bg-muted text-muted-foreground">
                {test.category || "General"}
              </span>
            </div>

            {/* Stacked Label: Value lines */}
            <div className="space-y-1.5 text-xs">
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
                    <AlertDialogTitle>Delete {test.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Tests already used in a prescription cannot be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto min-h-[44px]">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(test.id)} className="w-full sm:w-auto min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
        {labTests.length === 0 && (
          <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl bg-card">
            <FlaskConical className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="font-medium text-foreground">No laboratory tests found</p>
            <p className="text-xs text-muted-foreground mt-1">Add diagnostic and lab tests to the clinic catalog.</p>
          </div>
        )}
      </div>

      {/* Desktop & Tablet Table View (md: 768px+) */}
      <div className="hidden md:block border border-border/60 rounded-xl overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Test Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Normal Range / Standard</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labTests.map((test) => (
              <TableRow key={test.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-primary shrink-0" strokeWidth={1.75} />
                    {test.name}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-muted/80 text-muted-foreground">
                    {test.category || "General"}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs">{test.normalRange || "—"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(test)} className="min-h-[36px] min-w-[36px] hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Pencil className="h-4 w-4" strokeWidth={1.75} />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "min-h-[36px] min-w-[36px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      )}
                      aria-label={`Delete ${test.name}`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {test.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Tests already used in a prescription cannot be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(test.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                <TableCell colSpan={4} className="text-center text-muted-foreground py-16">
                  <FlaskConical className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
                  <p className="font-medium text-foreground">No laboratory tests found</p>
                  <p className="text-xs text-muted-foreground mt-1">Add diagnostic and lab tests to the clinic catalog.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{editing ? "Edit Lab Test" : "Add Lab Test"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="name">Test Name</Label>
              <Input id="name" name="name" defaultValue={editing?.name || ""} required placeholder="e.g., Complete Blood Count (CBC)" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="e.g., Hematology, Biochemistry, Radiology"
                defaultValue={editing?.category || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="normalRange">Normal Reference Range</Label>
              <Input
                id="normalRange"
                name="normalRange"
                placeholder="e.g. 4.5–11.0 x10⁹/L"
                defaultValue={editing?.normalRange || ""}
              />
            </div>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto min-h-[44px]">
                {isPending ? "Saving..." : editing ? "Save Changes" : "Add Lab Test"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}