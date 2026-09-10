"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

async function requireStaff() {
  const session = await auth();
  if (!session || !["doctor", "receptionist", "admin"].includes(session.user.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

async function generatePatientCode() {
  const count = await prisma.patient.count();
  return `PT-${String(count + 1).padStart(4, "0")}`;
}

function generateTempPassword() {
  // 8-character hex string, easy to read aloud and hand over at the front desk
  return crypto.randomBytes(4).toString("hex");
}

export async function createPatient(formData) {
  const session = await requireStaff();

  const fullName = formData.get("fullName");
  const fatherHusbandName = formData.get("fatherHusbandName");
  const gender = formData.get("gender");
  const dateOfBirth = formData.get("dateOfBirth");
  const age = formData.get("age");
  const phone = formData.get("phone");
  const email = formData.get("email");
  const cnic = formData.get("cnic");
  const address = formData.get("address");
  const bloodGroup = formData.get("bloodGroup");
  const emergencyContact = formData.get("emergencyContact");
  const allergies = formData.get("allergies");
  const existingDiseases = formData.get("existingDiseases");
  const heightCm = formData.get("heightCm");
  const weightKg = formData.get("weightKg");

  if (!fullName || !gender || !phone) {
    return { error: "Name, gender, and phone are required" };
  }

  const existingPhone = await prisma.patient.findUnique({ where: { phone } });
  if (existingPhone) {
    return { error: "A patient with this phone number already exists", existingPatientId: existingPhone.id };
  }

  if (cnic) {
    const existingCnic = await prisma.patient.findUnique({ where: { cnic } });
    if (existingCnic) {
      return { error: "A patient with this CNIC already exists", existingPatientId: existingCnic.id };
    }
  }

  // Phone doubles as the login identifier, stored in User.email, since
  // patients aren't guaranteed to have a real email address.
  const loginIdentifier = phone;
  const existingUser = await prisma.user.findUnique({ where: { email: loginIdentifier } });
  if (existingUser) {
    return { error: "A login already exists for this phone number. This patient may already be registered." };
  }

  const patientCode = await generatePatientCode();
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const patient = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: loginIdentifier,
        passwordHash,
        role: "patient",
        isActive: true,
      },
    });

    const patient = await tx.patient.create({
      data: {
        userId: user.id,
        patientCode,
        fullName,
        fatherHusbandName: fatherHusbandName || null,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        age: age ? parseInt(age, 10) : null,
        phone,
        email: email || null,
        cnic: cnic || null,
        address: address || null,
        bloodGroup: bloodGroup || null,
        emergencyContact: emergencyContact || null,
        allergies: allergies || null,
        existingDiseases: existingDiseases || null,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "registered_patient",
        entityType: "patient",
        entityId: patient.id,
        details: { fullName, phone },
      },
    });

    return patient;
  });

  revalidatePath("/doctor/patients");
  revalidatePath("/receptionist/patients");

  return {
    success: true,
    patientId: patient.id,
    credentials: { username: loginIdentifier, tempPassword },
  };
}

export async function updatePatient(patientId, formData) {
  const session = await requireStaff();

  const fullName = formData.get("fullName");
  const fatherHusbandName = formData.get("fatherHusbandName");
  const gender = formData.get("gender");
  const dateOfBirth = formData.get("dateOfBirth");
  const age = formData.get("age");
  const email = formData.get("email");
  const cnic = formData.get("cnic");
  const address = formData.get("address");
  const bloodGroup = formData.get("bloodGroup");
  const emergencyContact = formData.get("emergencyContact");
  const allergies = formData.get("allergies");
  const existingDiseases = formData.get("existingDiseases");
  const heightCm = formData.get("heightCm");
  const weightKg = formData.get("weightKg");

  if (!fullName || !gender) {
    return { error: "Name and gender are required" };
  }

  if (cnic) {
    const duplicate = await prisma.patient.findFirst({ where: { cnic, NOT: { id: patientId } } });
    if (duplicate) return { error: "Another patient already uses this CNIC" };
  }

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      fullName,
      fatherHusbandName: fatherHusbandName || null,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      age: age ? parseInt(age, 10) : null,
      email: email || null,
      cnic: cnic || null,
      address: address || null,
      bloodGroup: bloodGroup || null,
      emergencyContact: emergencyContact || null,
      allergies: allergies || null,
      existingDiseases: existingDiseases || null,
      heightCm: heightCm ? parseFloat(heightCm) : null,
      weightKg: weightKg ? parseFloat(weightKg) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "updated_patient",
      entityType: "patient",
      entityId: patientId,
    },
  });

  revalidatePath(`/doctor/patients/${patientId}`);
  revalidatePath(`/receptionist/patients/${patientId}`);
  return { success: true };
}