-- Indexes for the columns lists filter and sort on (lib/lists.js, audit log).
-- Additive only: no data changes.
CREATE INDEX "prescriptions_doctorId_status_idx" ON "prescriptions"("doctorId", "status");
CREATE INDEX "prescriptions_patientId_visitDate_idx" ON "prescriptions"("patientId", "visitDate");
CREATE INDEX "appointments_scheduledAt_idx" ON "appointments"("scheduledAt");
CREATE INDEX "appointments_patientId_scheduledAt_idx" ON "appointments"("patientId", "scheduledAt");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "audit_logs_entityType_action_idx" ON "audit_logs"("entityType", "action");
CREATE INDEX "reports_generatedAt_idx" ON "reports"("generatedAt");
