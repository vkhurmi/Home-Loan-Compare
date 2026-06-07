-- cleanup-duplicate-loan-rates.sql
-- Remove exact duplicate loan rate entries for each bank.
-- This keeps one row per bank/date/rate combination and deletes duplicate rows.

-- Step 1: Create a backup before cleanup.
-- Run this once to preserve the current state.
CREATE TABLE IF NOT EXISTS rates_backup AS
SELECT * FROM rates;

-- Step 2: Delete exact duplicate rate rows.
-- Keeps the earliest row for each duplicate group.
DELETE FROM rates
WHERE id NOT IN (
  SELECT MIN(id)
  FROM rates
  GROUP BY bank_id, rate_date, term_1year, term_2year, term_3year, term_5year
);

-- Optional verification queries:
-- Count duplicate groups.
-- SELECT
--   b.name,
--   r.rate_date,
--   r.term_1year,
--   r.term_2year,
--   r.term_3year,
--   r.term_5year,
--   COUNT(*) as duplicate_count
-- FROM rates r
-- JOIN banks b ON r.bank_id = b.id
-- GROUP BY r.bank_id, b.name, r.rate_date, r.term_1year, r.term_2year, r.term_3year, r.term_5year
-- HAVING COUNT(*) > 1
-- ORDER BY b.name, r.rate_date DESC;
