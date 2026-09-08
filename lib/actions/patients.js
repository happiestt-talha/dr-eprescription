"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
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
  const next = count + 1;
  return `PT-${String(next).padStart(4, "0")}`;
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

  const patientCode = await generatePatientCode();

  const patient = await prisma.patient.create({
    data: {
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

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "registered_patient",
      entityType: "patient",
      entityId: patient.id,
      details: { fullName, phone },
    },
  });

  revalidatePath("/doctor/patients");
  revalidatePath("/receptionist/patients");
  return { success: true, patientId: patient.id };
}