// Display label and badge tone for an audit log action ("deactivated_doctor"
// → "Deactivated doctor", danger). Pure: shared by the audit log page and the
// admin dashboard, in the browser and on the server.

export function auditActionLabel(action) {
  const text = String(action ?? "").replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function auditActionTone(action) {
  const act = String(action ?? "").toLowerCase();
  // "deactivated_doctor" contains "activate": check the negative ones first.
  if (/delete|remove|deactivate|inactive|failed/.test(act)) return "danger";
  if (/create|register|add|activate|book|generate/.test(act)) return "success";
  if (/update|edit|modify|reschedule|reset|change/.test(act)) return "info";
  return "neutral";
}
