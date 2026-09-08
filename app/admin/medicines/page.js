import { prisma } from "@/lib/db";
import { MedicinesTable } from "@/components/admin/medicines-table";

export default async function MedicinesPage() {
  const medicines = await prisma.medicine.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Medicines</h1>
      </div>
      <MedicinesTable medicines={medicines} />
    </div>
  );
}