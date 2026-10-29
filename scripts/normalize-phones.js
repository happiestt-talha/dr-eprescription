// One-off: convert stored phone numbers to the canonical +923XXXXXXXXX form.
// Dry run by default; pass --apply to write.
//
//   node --env-file=.env scripts/normalize-phones.js           # preview
//   node --env-file=.env scripts/normalize-phones.js --apply   # do it
//
// Converts patients.phone together with the patient's login (users.email),
// patients.emergencyContact and doctors.phone. Values that aren't recognisable
// Pakistani mobiles, or that would collide with another record, are reported
// and left untouched. Every change is audit-logged.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// Same rules as lib/sanitize.js normalizePhonePK (kept inline: this is a plain
// node script without the app's path aliases).
function normalizePhonePK(value) {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(4);
  else if (digits.startsWith("92") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return /^3\d{9}$/.test(digits) ? `+92${digits}` : "";
}

async function main() {
  console.log(`Database: ${new URL(process.env.DATABASE_URL).host}`);
  console.log(APPLY ? "Mode: APPLY (writing changes)\n" : "Mode: dry run (no changes; pass --apply to write)\n");

  const actor = await prisma.user.findFirst({ where: { role: "admin", isActive: true }, orderBy: { createdAt: "asc" } });
  if (!actor) throw new Error("No active admin to attribute the audit log to; aborting.");

  const patients = await prisma.patient.findMany({ include: { user: { select: { id: true, email: true } } } });
  const doctors = await prisma.doctor.findMany({ select: { id: true, fullName: true, phone: true } });
  const takenPhones = new Set(patients.map((p) => p.phone));
  const takenLogins = new Set((await prisma.user.findMany({ select: { email: true } })).map((u) => u.email));

  const changes = [];
  const skipped = [];

  for (const p of patients) {
    const phone = normalizePhonePK(p.phone);
    if (!phone) {
      skipped.push({ record: `patient ${p.patientCode}`, value: p.phone, reason: "not a Pakistani mobile" });
    } else if (phone !== p.phone) {
      const loginChanges = p.user && p.user.email !== phone;
      if (takenPhones.has(phone) || (loginChanges && takenLogins.has(phone))) {
        skipped.push({ record: `patient ${p.patientCode}`, value: p.phone, reason: `${phone} already used by another record` });
      } else {
        takenPhones.add(phone);
        if (loginChanges) takenLogins.add(phone);
        changes.push({ kind: "patient.phone", id: p.id, userId: loginChanges ? p.user.id : null, label: p.patientCode, from: p.phone, to: phone });
      }
    }
    if (p.emergencyContact) {
      const emergency = normalizePhonePK(p.emergencyContact);
      if (emergency && emergency !== p.emergencyContact) {
        changes.push({ kind: "patient.emergencyContact", id: p.id, label: p.patientCode, from: p.emergencyContact, to: emergency });
      } else if (!emergency) {
        skipped.push({ record: `patient ${p.patientCode} emergency contact`, value: p.emergencyContact, reason: "not a Pakistani mobile" });
      }
    }
  }

  for (const d of doctors) {
    if (!d.phone) continue;
    const phone = normalizePhonePK(d.phone);
    if (phone && phone !== d.phone) changes.push({ kind: "doctor.phone", id: d.id, label: d.fullName, from: d.phone, to: phone });
    else if (!phone) skipped.push({ record: `doctor ${d.fullName}`, value: d.phone, reason: "not a Pakistani mobile" });
  }

  console.log(`Changes (${changes.length}):`);
  console.table(changes.map(({ kind, label, from, to, userId }) => ({ kind, record: label, from, to, login: userId ? "updated too" : "" })));
  console.log(`Skipped (${skipped.length}):`);
  if (skipped.length) console.table(skipped);

  if (!APPLY) return;

  for (const c of changes) {
    const ops = [];
    if (c.kind === "patient.phone") {
      ops.push(prisma.patient.update({ where: { id: c.id }, data: { phone: c.to } }));
      if (c.userId) ops.push(prisma.user.update({ where: { id: c.userId }, data: { email: c.to } }));
    } else if (c.kind === "patient.emergencyContact") {
      ops.push(prisma.patient.update({ where: { id: c.id }, data: { emergencyContact: c.to } }));
    } else if (c.kind === "doctor.phone") {
      ops.push(prisma.doctor.update({ where: { id: c.id }, data: { phone: c.to } }));
    }
    ops.push(
      prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: "normalized_phone",
          entityType: c.kind.split(".")[0],
          entityId: c.id,
          details: { field: c.kind.split(".")[1], from: c.from, to: c.to },
        },
      })
    );
    await prisma.$transaction(ops);
  }
  console.log(`\nDone: ${changes.length} change(s) applied.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
