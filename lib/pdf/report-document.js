import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { BRAND } from "@/components/brand/logo-geometry";
import { PdfLogoMark } from "./logo";
import { formatDateTime } from "@/lib/datetime";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#111827" },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  titleText: { marginLeft: 8 },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", color: BRAND.ink },
  generated: { color: "#6b7280", marginTop: 2 },
  headRow: { flexDirection: "row", backgroundColor: BRAND.ink },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BRAND.mist },
  stripe: { backgroundColor: BRAND.paper },
  cell: { flex: 1, padding: 4 },
  headCell: { flex: 1, padding: 4, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  empty: { padding: 12, textAlign: "center", color: "#6b7280" },
  pageNumber: { position: "absolute", bottom: 16, right: 32, color: "#6b7280" },
});

export function ReportDocument({ title, headers, rows }) {
  return (
    <Document title={title}>
      <Page size="A4" orientation={headers.length > 5 ? "landscape" : "portrait"} style={styles.page}>
        <View style={styles.titleRow}>
          <PdfLogoMark size={30} />
          <View style={styles.titleText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.generated}>Generated {formatDateTime(new Date())} · MedScript</Text>
          </View>
        </View>

        {/* `fixed` repeats the header row at the top of every page */}
        <View style={styles.headRow} fixed>
          {headers.map((h) => (
            <Text key={h} style={styles.headCell}>{h}</Text>
          ))}
        </View>

        {rows.map((row, i) => (
          <View key={i} style={[styles.row, i % 2 === 1 && styles.stripe]} wrap={false}>
            {row.map((cell, j) => (
              <Text key={j} style={styles.cell}>{String(cell ?? "")}</Text>
            ))}
          </View>
        ))}
        {rows.length === 0 && <Text style={styles.empty}>No records match these filters.</Text>}

        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
