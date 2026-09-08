import { prisma } from "@/lib/db";
import { LabTestsTable } from "@/components/admin/lab-tests-table";

export default async function LabTestsPage() {
  const labTests = await prisma.labTest.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lab Tests</h1>
      </div>
      <LabTestsTable labTests={labTests} />
    </div>
  );
}