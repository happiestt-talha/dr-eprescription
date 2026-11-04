-- Age is now calculated from the date of birth instead of being typed in.
-- Additive and backwards compatible: existing rows get false.
ALTER TABLE "patients" ADD COLUMN "dobEstimated" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: patients that only have a typed age get an estimated date of
-- birth (1 January of the matching year, clinic time), so their age keeps
-- advancing. Rows with a real date of birth are untouched.
UPDATE "patients"
SET "dateOfBirth" = make_date(
      (EXTRACT(YEAR FROM ("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi'))::int - "age"),
      1, 1)::timestamp,
    "dobEstimated" = true
WHERE "dateOfBirth" IS NULL
  AND "age" IS NOT NULL
  AND "age" BETWEEN 0 AND 130;
