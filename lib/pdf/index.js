import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { BRAND } from "@/components/brand/logo-geometry";
import { PrescriptionDocument } from "./prescription-document";
import { ReportDocument } from "./report-document";

// PDFs are rendered in-process with @react-pdf/renderer: no external binary,
// temp files or env config. Layouts live in lib/pdf/*-document.js.

export async function renderPrescriptionPdf(rx, verifyUrl) {
  // Drafts get no verification QR: they can still change, so nothing should vouch for them.
  const qrDataUrl =
    rx.status === "finalized"
      ? await QRCode.toDataURL(verifyUrl, { width: 240, margin: 1, color: { dark: BRAND.ink } })
      : null;
  return renderToBuffer(<PrescriptionDocument rx={rx} qrDataUrl={qrDataUrl} verifyUrl={verifyUrl} />);
}

export async function renderReportPdf(title, headers, rows) {
  return renderToBuffer(<ReportDocument title={title} headers={headers} rows={rows} />);
}
