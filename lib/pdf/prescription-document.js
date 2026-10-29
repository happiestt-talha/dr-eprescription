import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { BRAND } from "@/components/brand/logo-geometry";
import { PdfLogoMark, PdfWordmark } from "./logo";
import { formatDate } from "@/lib/datetime";

// Built-in Helvetica covers Latin text plus symbols like ° and —. Non-Latin
// scripts (e.g. Urdu) would need a font registered via Font.register().

const colors = {
  ink: BRAND.ink,
  primary: BRAND.sage,
  accent: BRAND.mint,
  text: "#26332e",
  muted: "#6b7a73",
  rule: "#d8e7df",
  tint: BRAND.paper,
};

// A4 is 595 × 842 pt. The watermark is centred on every page.
const WATERMARK_SIZE = 400;

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 64,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: colors.text,
  },
  watermark: {
    position: "absolute",
    top: (842 - WATERMARK_SIZE) / 2,
    left: (595 - WATERMARK_SIZE) / 2,
  },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { flexDirection: "row", alignItems: "center" },
  brandText: { marginLeft: 10 },
  clinicName: { fontSize: 17, fontFamily: "Helvetica-Bold", color: colors.ink },
  muted: { color: colors.muted },
  small: { fontSize: 8.5 },
  doctorName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: colors.ink, textAlign: "right" },
  right: { textAlign: "right" },
  rule: { flexDirection: "row", marginTop: 12, marginBottom: 14 },
  ruleInk: { height: 2.5, flexGrow: 1, backgroundColor: colors.ink },
  ruleAccent: { height: 2.5, width: 56, backgroundColor: colors.accent },

  patient: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: colors.rule,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 3,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: "#ffffff",
  },
  patientItem: { width: "33.3%", marginBottom: 4 },
  fieldLabel: { fontSize: 7, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 1 },
  fieldValue: { fontFamily: "Helvetica-Bold", color: colors.ink },

  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  vitals: { flexDirection: "row", flexWrap: "wrap" },
  vital: {
    backgroundColor: colors.tint,
    borderRadius: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  vitalLabel: { color: colors.muted },
  twoCol: { flexDirection: "row", marginBottom: 2 },
  col: { flex: 1, paddingRight: 12 },

  rxHead: { flexDirection: "row", alignItems: "flex-end", marginBottom: 6, marginTop: 2 },
  rxSymbol: { fontFamily: "Times-Italic", fontSize: 24, color: colors.accent, lineHeight: 1 },
  rxCaption: { marginLeft: 8, marginBottom: 3, fontSize: 8, color: colors.muted, textTransform: "uppercase", letterSpacing: 1.2 },
  table: { borderRadius: 3, overflow: "hidden" },
  tableHead: { flexDirection: "row", backgroundColor: colors.ink },
  headCell: { padding: 5, color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.rule },
  zebra: { backgroundColor: colors.tint },
  cell: { padding: 5 },
  medName: { fontFamily: "Helvetica-Bold", color: colors.ink },

  listItem: { flexDirection: "row", marginBottom: 2 },
  bullet: { width: 12, color: colors.accent, fontFamily: "Helvetica-Bold" },

  signatureBlock: {
    marginTop: "auto",
    paddingTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  qrBox: { flexDirection: "row", alignItems: "center" },
  qr: { width: 74, height: 74 },
  qrText: { marginLeft: 8, width: 140 },
  qrTitle: { fontFamily: "Helvetica-Bold", color: colors.ink, marginBottom: 2 },
  draftBox: { borderWidth: 1.5, borderColor: "#b42318", borderRadius: 4, paddingVertical: 8, paddingHorizontal: 12 },
  draftTitle: { fontFamily: "Helvetica-Bold", color: "#b42318", fontSize: 14, letterSpacing: 2, marginBottom: 2 },
  signature: { width: 190, alignItems: "center" },
  signatureLine: { width: "100%", borderTopWidth: 1, borderTopColor: colors.ink, marginBottom: 4 },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.rule,
    paddingTop: 6,
  },
  footerBrand: { flexDirection: "row", alignItems: "center" },
  footerWord: { marginLeft: 5 },
});

const medicineColumns = [
  { key: "index", label: "#", width: "6%" },
  { key: "medicine", label: "Medicine", width: "30%" },
  { key: "dosage", label: "Dosage", width: "14%" },
  { key: "frequency", label: "Frequency", width: "16%" },
  { key: "duration", label: "Duration", width: "14%" },
  { key: "instructions", label: "Instructions", width: "20%" },
];

function vitalsList(v) {
  if (!v) return [];
  return [
    v.bloodPressure && ["BP", v.bloodPressure],
    v.temperatureF && ["Temp", `${v.temperatureF}°F`],
    v.pulseRate && ["Pulse", `${v.pulseRate} bpm`],
    v.spo2 && ["SpO2", `${v.spo2}%`],
    v.heightCm && ["Height", `${v.heightCm} cm`],
    v.weightKg && ["Weight", `${v.weightKg} kg`],
  ].filter(Boolean);
}

function Field({ label, value }) {
  return (
    <View style={styles.patientItem}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function PrescriptionDocument({ rx, qrDataUrl, verifyUrl }) {
  const { doctor, patient } = rx;
  const vitals = vitalsList(rx.vitals);
  const verifyHost = new URL(verifyUrl).host;

  return (
    <Document title={`Prescription ${rx.prescriptionCode}`} author={`Dr. ${doctor.fullName}`} creator="MedScript">
      <Page size="A4" style={styles.page}>
        <View style={styles.watermark} fixed>
          <PdfLogoMark size={WATERMARK_SIZE} opacity={0.06} />
        </View>

        <View style={styles.header}>
          <View style={styles.brand}>
            <PdfLogoMark size={40} />
            <View style={styles.brandText}>
              <Text style={styles.clinicName}>{doctor.clinicName || "Clinic"}</Text>
              {doctor.clinicAddress ? <Text style={[styles.muted, styles.small]}>{doctor.clinicAddress}</Text> : null}
              {doctor.phone ? <Text style={[styles.muted, styles.small]}>Phone: {doctor.phone}</Text> : null}
            </View>
          </View>
          <View>
            <Text style={styles.doctorName}>Dr. {doctor.fullName}</Text>
            <Text style={styles.right}>{doctor.qualification}</Text>
            <Text style={[styles.right, styles.muted]}>{doctor.specialization}</Text>
            <Text style={[styles.right, styles.muted, styles.small]}>Reg. No: {doctor.registrationNo}</Text>
          </View>
        </View>
        <View style={styles.rule}>
          <View style={styles.ruleInk} />
          <View style={styles.ruleAccent} />
        </View>

        <View style={styles.patient}>
          <Field label="Patient" value={patient.fullName} />
          <Field label="Patient ID" value={patient.patientCode} />
          <Field label="Age / Gender" value={`${patient.age ?? "—"} / ${patient.gender}`} />
          <Field label="Date" value={formatDate(rx.visitDate)} />
          <Field label="Prescription No." value={rx.prescriptionCode} />
          {patient.allergies ? <Field label="Allergies" value={patient.allergies} /> : null}
        </View>

        {vitals.length > 0 && (
          <Section title="Vitals">
            <View style={styles.vitals}>
              {vitals.map(([label, value]) => (
                <Text key={label} style={styles.vital}>
                  <Text style={styles.vitalLabel}>{label} </Text>
                  {value}
                </Text>
              ))}
            </View>
          </Section>
        )}

        {(rx.symptoms || rx.diagnosis) && (
          <View style={styles.twoCol}>
            {rx.symptoms ? (
              <View style={styles.col}>
                <Section title="Symptoms">
                  <Text>{rx.symptoms}</Text>
                </Section>
              </View>
            ) : null}
            {rx.diagnosis ? (
              <View style={styles.col}>
                <Section title="Diagnosis">
                  <Text style={styles.medName}>{rx.diagnosis}</Text>
                </Section>
              </View>
            ) : null}
          </View>
        )}

        {rx.medicines.length > 0 && (
          <View style={styles.section}>
            <View style={styles.rxHead}>
              <Text style={styles.rxSymbol}>Rx</Text>
              <Text style={styles.rxCaption}>Medicines</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHead}>
                {medicineColumns.map((c) => (
                  <Text key={c.key} style={[styles.headCell, { width: c.width }]}>{c.label}</Text>
                ))}
              </View>
              {rx.medicines.map((pm, i) => {
                const strength = pm.medicine.strength ? ` ${pm.medicine.strength}` : "";
                return (
                  <View key={pm.id} style={[styles.row, i % 2 === 1 && styles.zebra]} wrap={false}>
                    <Text style={[styles.cell, { width: "6%" }]}>{i + 1}</Text>
                    <Text style={[styles.cell, styles.medName, { width: "30%" }]}>{`${pm.medicine.name}${strength}`}</Text>
                    <Text style={[styles.cell, { width: "14%" }]}>{pm.dosage}</Text>
                    <Text style={[styles.cell, { width: "16%" }]}>{pm.frequency}</Text>
                    <Text style={[styles.cell, { width: "14%" }]}>{pm.duration}</Text>
                    <Text style={[styles.cell, styles.muted, { width: "20%" }]}>{pm.instructions || ""}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {rx.labTests.length > 0 && (
          <Section title="Laboratory Tests">
            {rx.labTests.map((plt) => (
              <View key={plt.id} style={styles.listItem}>
                <Text style={styles.bullet}>+</Text>
                <Text>
                  {plt.labTest.name}
                  {plt.instructions ? <Text style={styles.muted}>{`  (${plt.instructions})`}</Text> : null}
                </Text>
              </View>
            ))}
          </Section>
        )}

        {rx.advice ? (
          <Section title="Advice">
            <Text>{rx.advice}</Text>
          </Section>
        ) : null}

        <View style={styles.signatureBlock} wrap={false}>
          {qrDataUrl ? (
            <View style={styles.qrBox}>
              {/* react-pdf's Image is not an HTML <img> and has no alt prop */}
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={qrDataUrl} style={styles.qr} />
              <View style={styles.qrText}>
                <Text style={styles.qrTitle}>Scan to verify</Text>
                <Text style={[styles.muted, styles.small]}>
                  Confirms this prescription is authentic and was issued by this clinic.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.draftBox}>
              <Text style={styles.draftTitle}>DRAFT</Text>
              <Text style={[styles.muted, styles.small]}>Not a valid prescription until finalized.</Text>
            </View>
          )}
          <View style={styles.signature}>
            <View style={styles.signatureLine} />
            <Text style={styles.medName}>Dr. {doctor.fullName}</Text>
            <Text style={[styles.muted, styles.small]}>Signature & stamp</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerBrand}>
            <PdfLogoMark size={12} />
            <PdfWordmark height={9} style={styles.footerWord} />
          </View>
          <Text style={[styles.muted, styles.small]}>
            {rx.prescriptionCode} · Verify at {verifyHost}/verify
          </Text>
          <Text
            style={[styles.muted, styles.small]}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
