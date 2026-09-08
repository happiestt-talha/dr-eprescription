const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// ---------- helpers ----------
function hash(pw) {
  return bcrypt.hashSync(pw, 10);
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMultiple(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function main() {
  console.log("Cleaning existing records for fresh seed...");
  await prisma.prescriptionMedicine.deleteMany();
  await prisma.prescriptionLabTest.deleteMany();
  await prisma.vitals.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.receptionist.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.labTest.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding database with Pakistani demographic dummy data...");

  // ============================================================
  // 1. USERS + 2. DOCTORS
  // ============================================================
  const doctorSeedData = [
    {
      email: "dr.ahmed.raza@drclinic.pk",
      password: "Doctor@123",
      fullName: "Dr. Ahmed Raza",
      qualification: "MBBS, FCPS (Medicine)",
      specialization: "General Physician",
      registrationNo: "PMDC-41235-P",
      phone: "+923001234567",
      clinicName: "Raza Family Clinic",
      clinicAddress: "12-B, Gulberg III, Lahore, Punjab",
    },
    {
      email: "dr.ayesha.siddiqui@drclinic.pk",
      password: "Doctor@123",
      fullName: "Dr. Ayesha Siddiqui",
      qualification: "MBBS, FCPS (Gynae & Obs)",
      specialization: "Gynecologist",
      registrationNo: "PMDC-38942-P",
      phone: "+923214567890",
      clinicName: "Siddiqui Women's Care Center",
      clinicAddress: "Block 4, Clifton, Karachi, Sindh",
    },
    {
      email: "dr.bilal.khan@drclinic.pk",
      password: "Doctor@123",
      fullName: "Dr. Muhammad Bilal Khan",
      qualification: "MBBS, FCPS (Cardiology)",
      specialization: "Cardiologist",
      registrationNo: "PMDC-27650-P",
      phone: "+923339876543",
      clinicName: "Khan Heart Care",
      clinicAddress: "F-10 Markaz, Islamabad",
    },
    {
      email: "dr.sana.malik@drclinic.pk",
      password: "Doctor@123",
      fullName: "Dr. Sana Malik",
      qualification: "MBBS, FCPS (Pediatrics)",
      specialization: "Pediatrician",
      registrationNo: "PMDC-55012-P",
      phone: "+923451239876",
      clinicName: "Little Stars Children's Clinic",
      clinicAddress: "Satellite Town, Rawalpindi, Punjab",
    },
    {
      email: "dr.farhan.tariq@drclinic.pk",
      password: "Doctor@123",
      fullName: "Dr. Farhan Tariq",
      qualification: "MBBS, MCPS (Dermatology)",
      specialization: "Dermatologist",
      registrationNo: "PMDC-63187-P",
      phone: "+923087654321",
      clinicName: "Tariq Skin & Laser Clinic",
      clinicAddress: "Liberty Market, Faisalabad, Punjab",
    },
  ];

  const doctors = [];
  for (const d of doctorSeedData) {
    const user = await prisma.user.create({
      data: {
        email: d.email,
        passwordHash: hash(d.password),
        role: "doctor",
        isActive: true,
      },
    });
    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        fullName: d.fullName,
        qualification: d.qualification,
        specialization: d.specialization,
        registrationNo: d.registrationNo,
        phone: d.phone,
        clinicName: d.clinicName,
        clinicAddress: d.clinicAddress,
        profilePictureUrl: null,
        signatureUrl: null,
      },
    });
    doctors.push(doctor);
  }
  console.log(`Created ${doctors.length} doctors`);

  // ============================================================
  // ADMIN USER (seeded separately, no admin table per schema —
  // admin is just a role on the users table)
  // ============================================================
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@drclinic.pk" },
    update: {},
    create: {
      email: "admin@drclinic.pk",
      passwordHash: hash("Admin@123"),
      role: "admin",
      isActive: true,
    },
  });
  await prisma.user.upsert({
    where: { email: "admin@clinic.com" },
    update: {},
    create: {
      email: "admin@clinic.com",
      passwordHash: hash("admin123"),
      role: "admin",
      isActive: true,
    },
  });
  console.log("Admin user ensured:", adminUser.email);

  // ============================================================
  // 3. RECEPTIONISTS
  // ============================================================
  const receptionistSeedData = [
    {
      email: "sara.ahmed@drclinic.pk",
      password: "Reception@123",
      fullName: "Sara Ahmed",
      phone: "+923112345678",
      clinicName: "Raza Family Clinic",
    },
    {
      email: "bilal.hussain@drclinic.pk",
      password: "Reception@123",
      fullName: "Bilal Hussain",
      phone: "+923223456789",
      clinicName: "Khan Heart Care",
    },
    {
      email: "nimra.fatima@drclinic.pk",
      password: "Reception@123",
      fullName: "Nimra Fatima",
      phone: "+923334567891",
      clinicName: "Little Stars Children's Clinic",
    },
  ];

  const receptionists = [];
  for (const r of receptionistSeedData) {
    const user = await prisma.user.create({
      data: {
        email: r.email,
        passwordHash: hash(r.password),
        role: "receptionist",
        isActive: true,
      },
    });
    const receptionist = await prisma.receptionist.create({
      data: {
        userId: user.id,
        fullName: r.fullName,
        phone: r.phone,
        clinicName: r.clinicName,
      },
    });
    receptionists.push(receptionist);
  }
  console.log(`Created ${receptionists.length} receptionists`);

  // ============================================================
  // 4. PATIENTS
  // ============================================================
  const patientSeedData = [
    { fullName: "Muhammad Usman", father: "Muhammad Iqbal", gender: "male", dob: "1990-03-14", phone: "+923001112233", cnic: "35202-1234567-1", address: "House 45, Model Town, Lahore", bloodGroup: "B+", allergies: "Penicillin", diseases: "Hypertension", height: 172, weight: 78 },
    { fullName: "Ayesha Bibi", father: "Abdul Rasheed", gender: "female", dob: "1995-07-22", phone: "+923002223344", cnic: "35201-2345678-2", address: "Street 7, Johar Town, Lahore", bloodGroup: "O+", allergies: null, diseases: null, height: 160, weight: 58 },
    { fullName: "Fatima Zahra", father: "Zulfiqar Ahmed", gender: "female", dob: "1988-11-05", phone: "+923003334455", cnic: "42101-3456789-3", address: "Block 6, Gulshan-e-Iqbal, Karachi", bloodGroup: "A+", allergies: "Sulfa drugs", diseases: "Type 2 Diabetes", height: 158, weight: 65 },
    { fullName: "Ali Hassan", father: "Hassan Raza", gender: "male", dob: "2001-01-30", phone: "+923004445566", cnic: "42201-4567890-4", address: "North Nazimabad, Karachi", bloodGroup: "AB+", allergies: null, diseases: null, height: 175, weight: 70 },
    { fullName: "Zainab Fatima", father: "Tariq Mehmood", gender: "female", dob: "1975-09-18", phone: "+923005556677", cnic: "61101-5678901-5", address: "Satellite Town, Rawalpindi", bloodGroup: "B-", allergies: "Aspirin", diseases: "Asthma", height: 162, weight: 60 },
    { fullName: "Hamza Sheikh", father: "Sheikh Nadeem", gender: "male", dob: "1998-04-12", phone: "+923006667788", cnic: "61102-6789012-6", address: "Chaklala Scheme 3, Rawalpindi", bloodGroup: "O-", allergies: null, diseases: null, height: 178, weight: 82 },
    { fullName: "Mariam Yousaf", father: "Yousaf Ali", gender: "female", dob: "2010-06-25", phone: "+923007778899", cnic: null, address: "Wapda Town, Faisalabad", bloodGroup: "A-", allergies: null, diseases: null, height: 140, weight: 35 },
    { fullName: "Abdullah Nasir", father: "Nasir Mahmood", gender: "male", dob: "1965-12-02", phone: "+923008889900", cnic: "33100-7890123-7", address: "Susan Road, Faisalabad", bloodGroup: "B+", allergies: "Ibuprofen", diseases: "Ischemic Heart Disease", height: 168, weight: 75 },
    { fullName: "Sadia Kanwal", father: "Kanwal Ahmed", gender: "female", dob: "1992-08-09", phone: "+923009990011", cnic: "35201-8901234-8", address: "Township, Lahore", bloodGroup: "AB-", allergies: null, diseases: null, height: 155, weight: 52 },
    { fullName: "Bilal Aslam", father: "Muhammad Aslam", gender: "male", dob: "1985-02-27", phone: "+923011101122", cnic: "42301-9012345-9", address: "Malir, Karachi", bloodGroup: "O+", allergies: null, diseases: "Chronic Kidney Disease", height: 170, weight: 68 },
    { fullName: "Rabia Sarwar", father: "Sarwar Khan", gender: "female", dob: "2003-10-15", phone: "+923022213344", cnic: "17101-0123456-0", address: "Hayatabad, Peshawar", bloodGroup: "A+", allergies: null, diseases: null, height: 163, weight: 55 },
    { fullName: "Kashif Iqbal", father: "Iqbal Hussain", gender: "male", dob: "1979-05-08", phone: "+923033324455", cnic: "17201-1234509-1", address: "University Town, Peshawar", bloodGroup: "B+", allergies: "Penicillin", diseases: "Hypertension", height: 174, weight: 88 },
    { fullName: "Hina Shahzad", father: "Shahzad Butt", gender: "female", dob: "1996-03-19", phone: "+923044435566", cnic: "34101-2345098-2", address: "Cantt Area, Sialkot", bloodGroup: "O+", allergies: null, diseases: null, height: 159, weight: 57 },
    { fullName: "Imran Farooq", father: "Farooq Ahmed", gender: "male", dob: "1955-07-01", phone: "+923055546677", cnic: "31101-3450987-3", address: "GT Road, Gujranwala", bloodGroup: "AB+", allergies: "Codeine", diseases: "Type 2 Diabetes, Hypertension", height: 165, weight: 80 },
    { fullName: "Mahnoor Aziz", father: "Aziz Ur Rehman", gender: "female", dob: "2015-09-30", phone: "+923066657788", cnic: null, address: "DHA Phase 5, Lahore", bloodGroup: "A+", allergies: null, diseases: null, height: 110, weight: 22 },
  ];

  const patients = [];
  for (let i = 0; i < patientSeedData.length; i++) {
    const p = patientSeedData[i];
    const dob = new Date(p.dob);
    const age = new Date().getFullYear() - dob.getFullYear();
    const patient = await prisma.patient.create({
      data: {
        patientCode: `PT-${String(i + 1).padStart(4, "0")}`,
        fullName: p.fullName,
        fatherHusbandName: p.father,
        gender: p.gender,
        dateOfBirth: dob,
        age: age,
        phone: p.phone,
        email: null,
        cnic: p.cnic,
        address: p.address,
        bloodGroup: p.bloodGroup,
        emergencyContact: "+92300" + (1000000 + i * 37).toString().slice(0, 7),
        allergies: p.allergies,
        existingDiseases: p.diseases,
        heightCm: p.height,
        weightKg: p.weight,
      },
    });
    patients.push(patient);
  }
  console.log(`Created ${patients.length} patients`);

  // ============================================================
  // 7. MEDICINES (catalog)
  // ============================================================
  const medicineSeedData = [
    { name: "Panadol", generic: "Paracetamol", form: "tablet", strength: "500mg", manufacturer: "GSK Pakistan" },
    { name: "Augmentin", generic: "Amoxicillin/Clavulanate", form: "tablet", strength: "625mg", manufacturer: "GSK Pakistan" },
    { name: "Brufen", generic: "Ibuprofen", form: "tablet", strength: "400mg", manufacturer: "Abbott Pakistan" },
    { name: "Disprin", generic: "Aspirin", form: "tablet", strength: "300mg", manufacturer: "Reckitt Benckiser" },
    { name: "Calpol Syrup", generic: "Paracetamol", form: "syrup", strength: "120mg/5ml", manufacturer: "GSK Pakistan" },
    { name: "Flagyl", generic: "Metronidazole", form: "tablet", strength: "400mg", manufacturer: "Sanofi Pakistan" },
    { name: "Ventolin Inhaler", generic: "Salbutamol", form: "inhaler", strength: "100mcg", manufacturer: "GSK Pakistan" },
    { name: "Risek", generic: "Omeprazole", form: "capsule", strength: "20mg", manufacturer: "Getz Pharma" },
    { name: "Amoxil", generic: "Amoxicillin", form: "capsule", strength: "500mg", manufacturer: "GSK Pakistan" },
    { name: "Ponstan", generic: "Mefenamic Acid", form: "tablet", strength: "500mg", manufacturer: "Pfizer Pakistan" },
    { name: "Rigix", generic: "Rabeprazole", form: "tablet", strength: "20mg", manufacturer: "Getz Pharma" },
    { name: "Zimax", generic: "Azithromycin", form: "tablet", strength: "500mg", manufacturer: "Getz Pharma" },
    { name: "Ciproxin", generic: "Ciprofloxacin", form: "tablet", strength: "500mg", manufacturer: "Bayer Pakistan" },
    { name: "Loprin", generic: "Aspirin", form: "tablet", strength: "75mg", manufacturer: "Highnoon Laboratories" },
    { name: "Glucophage", generic: "Metformin", form: "tablet", strength: "500mg", manufacturer: "Merck Pakistan" },
    { name: "Concor", generic: "Bisoprolol", form: "tablet", strength: "5mg", manufacturer: "Merck Pakistan" },
    { name: "Lipiget", generic: "Atorvastatin", form: "tablet", strength: "20mg", manufacturer: "Getz Pharma" },
    { name: "Arinac Forte", generic: "Paracetamol/Phenylephrine/Chlorpheniramine", form: "tablet", strength: "500mg", manufacturer: "Abbott Pakistan" },
    { name: "Surbex-Z", generic: "Multivitamin", form: "tablet", strength: "N/A", manufacturer: "Abbott Pakistan" },
    { name: "Buscopan", generic: "Hyoscine Butylbromide", form: "tablet", strength: "10mg", manufacturer: "Sanofi Pakistan" },
  ];

  const medicines = [];
  for (const m of medicineSeedData) {
    const medicine = await prisma.medicine.create({
      data: {
        name: m.name,
        genericName: m.generic,
        dosageForm: m.form,
        strength: m.strength,
        manufacturer: m.manufacturer,
      },
    });
    medicines.push(medicine);
  }
  console.log(`Created ${medicines.length} medicines`);

  // ============================================================
  // 9. LAB TESTS (catalog)
  // ============================================================
  const labTestSeedData = [
    { name: "Complete Blood Count (CBC)", category: "Blood", range: "Varies by component" },
    { name: "Blood Sugar Random (RBS)", category: "Blood", range: "70-140 mg/dL" },
    { name: "Blood Sugar Fasting (FBS)", category: "Blood", range: "70-100 mg/dL" },
    { name: "Liver Function Test (LFT)", category: "Blood", range: "Varies by component" },
    { name: "Renal Function Test (RFT)", category: "Blood", range: "Varies by component" },
    { name: "Urine Detailed Report (Urine DR)", category: "Urine", range: "N/A" },
    { name: "Lipid Profile", category: "Blood", range: "Cholesterol < 200 mg/dL" },
    { name: "HbA1c", category: "Blood", range: "4-5.6%" },
    { name: "Chest X-Ray", category: "Imaging", range: "N/A" },
    { name: "ECG", category: "Cardiac", range: "N/A" },
    { name: "Widal Test", category: "Blood", range: "Titer < 1:80" },
    { name: "Dengue NS1 Antigen", category: "Blood", range: "Negative" },
    { name: "Hepatitis B Surface Antigen (HBsAg)", category: "Blood", range: "Non-reactive" },
    { name: "Hepatitis C Antibody (Anti-HCV)", category: "Blood", range: "Non-reactive" },
    { name: "Thyroid Profile (TSH, T3, T4)", category: "Blood", range: "TSH: 0.4-4.0 mIU/L" },
  ];

  const labTests = [];
  for (const l of labTestSeedData) {
    const labTest = await prisma.labTest.create({
      data: {
        name: l.name,
        category: l.category,
        normalRange: l.range,
      },
    });
    labTests.push(labTest);
  }
  console.log(`Created ${labTests.length} lab tests`);

  // ============================================================
  // 6. PRESCRIPTIONS + 5. VITALS + 8. PRESCRIPTION MEDICINES
  //    + 10. PRESCRIPTION LAB TESTS
  // ============================================================
  const symptomsPool = [
    "Fever, body aches, and mild headache for 3 days",
    "Persistent cough with chest congestion",
    "Abdominal pain and nausea after meals",
    "Shortness of breath on exertion",
    "Joint pain and stiffness in the knees",
    "Sore throat with difficulty swallowing",
    "Frequent urination and excessive thirst",
    "Skin rash with itching on both arms",
    "Dizziness and occasional palpitations",
    "Lower back pain radiating to the left leg",
  ];
  const diagnosisPool = [
    "Viral fever, likely seasonal influenza",
    "Acute bronchitis",
    "Gastritis",
    "Mild bronchial asthma",
    "Osteoarthritis of the knee",
    "Streptococcal pharyngitis",
    "Type 2 Diabetes Mellitus, newly diagnosed",
    "Allergic dermatitis",
    "Essential hypertension",
    "Lumbar disc prolapse, mild",
  ];
  const advicePool = [
    "Plenty of fluids, rest, and follow up after 5 days if symptoms persist.",
    "Avoid cold beverages and dusty environments. Steam inhalation twice daily.",
    "Avoid spicy and oily food. Take medicine after meals.",
    "Avoid known triggers. Keep inhaler accessible at all times.",
    "Light stretching exercises. Avoid squatting and stairs where possible.",
    "Warm saline gargles 3 times a day. Complete the antibiotic course.",
    "Start dietary control, reduce sugar intake, and begin daily walking for 30 minutes.",
    "Avoid the suspected allergen. Apply prescribed cream twice daily.",
    "Reduce salt intake, monitor blood pressure daily, and follow up in 2 weeks.",
    "Avoid heavy lifting and prolonged sitting. Physiotherapy recommended.",
  ];

  const prescriptions = [];
  let prescriptionCounter = 1;

  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const doctor = pick(doctors);
    const visitDate = randomDate(new Date("2026-06-01"), new Date("2026-09-07"));
    const idx = i % symptomsPool.length;
    const status = i % 5 === 0 ? "draft" : "finalized";
    const code = `RX-${new Date().getFullYear()}-${String(prescriptionCounter).padStart(5, "0")}`;
    prescriptionCounter++;

    const prescription = await prisma.prescription.create({
      data: {
        prescriptionCode: code,
        patientId: patient.id,
        doctorId: doctor.id,
        visitDate: visitDate,
        symptoms: symptomsPool[idx],
        diagnosis: diagnosisPool[idx],
        advice: advicePool[idx],
        qrCodeUrl: null,
        pdfUrl: null,
        status: status,
      },
    });
    prescriptions.push(prescription);

    // Vitals (one per prescription)
    await prisma.vitals.create({
      data: {
        prescriptionId: prescription.id,
        heightCm: patient.heightCm,
        weightKg: patient.weightKg,
        bloodPressure: `${100 + Math.floor(Math.random() * 40)}/${60 + Math.floor(Math.random() * 30)}`,
        temperatureF: (97 + Math.random() * 4).toFixed(1),
        pulseRate: 60 + Math.floor(Math.random() * 40),
        spo2: (94 + Math.random() * 6).toFixed(1),
      },
    });

    // Prescription Medicines (2-3 per prescription)
    const chosenMedicines = pickMultiple(medicines, 2 + (i % 2));
    const dosages = ["1 tablet", "2 tablets", "1 capsule", "10ml", "1 puff"];
    const frequencies = ["once daily", "twice daily", "three times daily", "as needed"];
    const durations = ["3 days", "5 days", "7 days", "10 days", "1 month"];
    const instructionsPool = ["after meals", "before meals", "at bedtime", "with plenty of water", null];

    for (const med of chosenMedicines) {
      await prisma.prescriptionMedicine.create({
        data: {
          prescriptionId: prescription.id,
          medicineId: med.id,
          dosage: pick(dosages),
          frequency: pick(frequencies),
          duration: pick(durations),
          instructions: pick(instructionsPool),
        },
      });
    }

    // Prescription Lab Tests (0-2 per prescription)
    if (i % 3 !== 0) {
      const chosenLabTests = pickMultiple(labTests, 1 + (i % 2));
      for (const lt of chosenLabTests) {
        await prisma.prescriptionLabTest.create({
          data: {
            prescriptionId: prescription.id,
            labTestId: lt.id,
            instructions: pick(["Fasting required", "Report next visit", null]),
          },
        });
      }
    }
  }
  console.log(`Created ${prescriptions.length} prescriptions with vitals, medicines, and lab tests`);

  // ============================================================
  // 11. APPOINTMENTS
  // ============================================================
  const appointmentStatuses = ["pending", "confirmed", "completed", "cancelled"];
  const appointments = [];

  for (let i = 0; i < 15; i++) {
    const patient = pick(patients);
    const doctor = pick(doctors);
    const bookedByUser = Math.random() > 0.5 ? pick(receptionists) : null;

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt: randomDate(new Date("2026-09-08"), new Date("2026-10-15")),
        status: pick(appointmentStatuses),
        bookedBy: bookedByUser ? bookedByUser.userId : null,
      },
    });
    appointments.push(appointment);
  }
  console.log(`Created ${appointments.length} appointments`);

  // ============================================================
  // 12. AUDIT LOGS
  // ============================================================
  const auditActions = [
    { action: "created_prescription", entityType: "prescription" },
    { action: "deactivated_doctor", entityType: "doctor" },
    { action: "activated_doctor", entityType: "doctor" },
    { action: "created_patient", entityType: "patient" },
    { action: "updated_patient", entityType: "patient" },
    { action: "added_medicine", entityType: "medicine" },
    { action: "deleted_medicine", entityType: "medicine" },
    { action: "added_lab_test", entityType: "lab_test" },
    { action: "generated_report", entityType: "report" },
    { action: "finalized_prescription", entityType: "prescription" },
  ];

  for (let i = 0; i < 15; i++) {
    const entry = pick(auditActions);
    let entityId;
    if (entry.entityType === "prescription") entityId = pick(prescriptions).id;
    else if (entry.entityType === "doctor") entityId = pick(doctors).id;
    else if (entry.entityType === "patient") entityId = pick(patients).id;
    else if (entry.entityType === "medicine") entityId = pick(medicines).id;
    else if (entry.entityType === "lab_test") entityId = pick(labTests).id;
    else entityId = adminUser.id;

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entityId,
        details: { note: `${entry.action} performed via admin panel`, timestamp: new Date().toISOString() },
        createdAt: randomDate(new Date("2026-07-01"), new Date("2026-09-07")),
      },
    });
  }
  console.log("Created 15 audit log entries");

  // ============================================================
  // 13. REPORTS
  // ============================================================
  const reportTypes = ["patients", "prescriptions", "appointments", "doctors", "medicines"];
  const reportFormats = ["pdf", "csv"];

  for (let i = 0; i < 6; i++) {
    const type = reportTypes[i % reportTypes.length];
    const format = pick(reportFormats);
    await prisma.report.create({
      data: {
        reportType: type,
        format: format,
        filters: { from: "2026-08-01", to: "2026-09-07", doctorId: i % 2 === 0 ? pick(doctors).id : null },
        fileUrl: `/reports/${type}-report-${Date.now() + i}.${format}`,
        generatedBy: adminUser.id,
        generatedAt: randomDate(new Date("2026-08-01"), new Date("2026-09-07")),
      },
    });
  }
  console.log("Created 6 report records");

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });