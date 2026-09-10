const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

function generateTempPassword() {
  return crypto.randomBytes(4).toString("hex");
}

async function main() {
  const patientsWithoutLogin = await prisma.patient.findMany({
    where: { userId: null },
  });

  if (patientsWithoutLogin.length === 0) {
    console.log("Every patient already has a login. Nothing to do.");
    return;
  }

  console.log(`Found ${patientsWithoutLogin.length} patient(s) without a login. Creating accounts...\n`);

  const results = [];

  for (const patient of patientsWithoutLogin) {
    const loginIdentifier = patient.phone;

    const existingUser = await prisma.user.findUnique({ where: { email: loginIdentifier } });
    if (existingUser) {
      console.log(`Skipped ${patient.fullName} (${patient.patientCode}): a login already exists for phone ${patient.phone}, but it isn't linked to this patient record. Check this one manually.`);
      continue;
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: loginIdentifier,
          passwordHash,
          role: "patient",
          isActive: true,
        },
      });

      await tx.patient.update({
        where: { id: patient.id },
        data: { userId: user.id },
      });
    });

    results.push({
      patientCode: patient.patientCode,
      fullName: patient.fullName,
      username: loginIdentifier,
      tempPassword,
    });
  }

  console.log("Done. Hand these credentials out before they're lost, they aren't stored anywhere in plaintext after this:\n");
  console.table(results);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());