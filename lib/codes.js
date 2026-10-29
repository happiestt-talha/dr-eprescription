import { Prisma } from "@prisma/client";

// Human-readable codes (PT-0001, RX-00001). The next number comes from the
// highest existing code rather than count(), so deleted rows and the seed's
// RX-2026-NNNNN format don't cause collisions. Two concurrent creates can still
// pick the same number; withUniqueRetry handles that.

export async function nextPatientCode(db) {
  const [{ max }] = await db.$queryRaw`
    SELECT MAX(substring("patientCode" from '^PT-(\\d+)$')::int) AS max FROM patients`;
  return `PT-${String((max ?? 0) + 1).padStart(4, "0")}`;
}

export async function nextPrescriptionCode(db) {
  const [{ max }] = await db.$queryRaw`
    SELECT MAX(substring("prescriptionCode" from '^RX-(\\d+)$')::int) AS max FROM prescriptions`;
  return `RX-${String((max ?? 0) + 1).padStart(5, "0")}`;
}

export async function withUniqueRetry(fn, field, attempts = 5) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const isCodeClash =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        String(err.meta?.target ?? "").includes(field);
      if (!isCodeClash || i >= attempts) throw err;
    }
  }
}
