// One-off clean-up for accounts created by prisma/seed.js, whose passwords are
// public (they're in the repo). Dry run by default; pass --apply to write.
//
//   node --env-file=.env scripts/secure-demo-accounts.js           # preview
//   node --env-file=.env scripts/secure-demo-accounts.js --apply   # do it
//
// - Staff accounts still using a seed password get a new random password,
//   printed once at the end. Accounts whose password was already changed are
//   left alone.
// - admin@clinic.com (the weakest one) is deactivated.
// - "Dr. " is stripped from doctor names (the UI already adds it).

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const SEED_PASSWORDS = ["Doctor@123", "Admin@123", "admin123", "Reception@123"];
const DEACTIVATE = ["admin@clinic.com"];

function generatePassword() {
  return crypto.randomBytes(9).toString("base64url"); // 12 chars
}

async function findSeedPassword(user) {
  for (const pw of SEED_PASSWORDS) {
    if (await bcrypt.compare(pw, user.passwordHash)) return pw;
  }
  return null;
}

async function main() {
  console.log(`Database: ${new URL(process.env.DATABASE_URL).host}`);
  console.log(APPLY ? "Mode: APPLY (writing changes)\n" : "Mode: dry run (no changes; pass --apply to write)\n");

  // Audit entries need an acting user: the first active admin that's being kept.
  const actor = await prisma.user.findFirst({
    where: { role: "admin", isActive: true, email: { notIn: DEACTIVATE } },
    orderBy: { createdAt: "asc" },
  });
  if (!actor) throw new Error("No active admin left to attribute the audit log to; aborting.");

  const staff = await prisma.user.findMany({
    where: { role: { in: ["admin", "doctor", "receptionist"] } },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  const plan = [];
  for (const user of staff) {
    if (DEACTIVATE.includes(user.email)) {
      if (user.isActive) plan.push({ user, change: "deactivate" });
      continue;
    }
    if (await findSeedPassword(user)) plan.push({ user, change: "rotate_password" });
  }

  const doctors = await prisma.doctor.findMany({ where: { fullName: { startsWith: "Dr" } } });
  const renames = doctors
    .map((d) => ({ doctor: d, newName: d.fullName.replace(/^\s*dr\.?\s+/i, "").trim() }))
    .filter((r) => r.newName !== r.doctor.fullName);

  console.log("Account changes:");
  console.table(plan.map((p) => ({ email: p.user.email, role: p.user.role, change: p.change })));
  console.log("Doctor name changes:");
  console.table(renames.map((r) => ({ from: r.doctor.fullName, to: r.newName })));

  if (!APPLY) return;

  const credentials = [];
  for (const { user, change } of plan) {
    if (change === "deactivate") {
      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { isActive: false } }),
        prisma.auditLog.create({
          data: { userId: actor.id, action: "deactivated_user", entityType: "user", entityId: user.id, details: { email: user.email, reason: "seed account with public password" } },
        }),
      ]);
    } else {
      const password = generatePassword();
      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } }),
        prisma.auditLog.create({
          data: { userId: actor.id, action: "reset_password", entityType: "user", entityId: user.id, details: { email: user.email, reason: "seed account with public password" } },
        }),
      ]);
      credentials.push({ email: user.email, role: user.role, newPassword: password });
    }
  }

  for (const { doctor, newName } of renames) {
    await prisma.doctor.update({ where: { id: doctor.id }, data: { fullName: newName } });
  }

  console.log("\nDone. New passwords (shown only once; they aren't stored in plaintext anywhere):");
  console.table(credentials);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
