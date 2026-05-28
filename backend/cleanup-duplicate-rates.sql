-- Cleanup Script: Remove Duplicate Rate Entries
-- This script helps manage duplicate rates in the database

-- ============================================================================
-- OPTION 1: Keep only the LATEST rate for each bank (removes all historical)
-- ============================================================================
-- Use this if you want only the most recent rate per bank
DELETE FROM rates
WHERE id NOT IN (
  SELECT MAX(id)
  FROM rates
  GROUP BY bank_id
);

-- ============================================================================
-- OPTION 2: Remove exact duplicates (same bank, date, and rate values)
-- ============================================================================
-- Use this if there are duplicate entries with identical data on the same date
-- This keeps the earliest entry and removes subsequent duplicates
DELETE FROM rates
WHERE id NOT IN (
  SELECT MIN(id)
  FROM rates
  GROUP BY bank_id, rate_date, term_1year, term_2year, term_3year, term_5year
);

-- ============================================================================
-- OPTION 3: Keep only one entry per bank per month (aggregate by month)
-- ============================================================================
-- Use this to keep monthly snapshots and remove intra-month duplicates
-- Keeps the latest entry for each bank-month combination
DELETE FROM rates
WHERE id NOT IN (
  SELECT MAX(id)
  FROM rates
  GROUP BY bank_id, DATE_TRUNC('month', rate_date)::date
);

-- ============================================================================
-- OPTION 4: Keep the latest N days of history (e.g., last 90 days)
-- ============================================================================
-- Use this to keep only recent data and remove old entries
-- Modify the INTERVAL to '30 days' or '1 year' as needed
DELETE FROM rates
WHERE rate_date < (SELECT MAX(rate_date) - INTERVAL '90 days' FROM rates)
  AND id NOT IN (
    SELECT MAX(id)
    FROM rates
    WHERE rate_date >= (SELECT MAX(rate_date) - INTERVAL '90 days' FROM rates)
    GROUP BY bank_id, rate_date
  );

-- ============================================================================
-- VERIFICATION QUERIES - Run these to check before cleanup
-- ============================================================================

-- Count total rates by bank before cleanup
SELECT 
  b.name,
  COUNT(r.id) as total_entries,
  COUNT(DISTINCT r.rate_date) as unique_dates,
  MIN(r.rate_date) as earliest_date,
  MAX(r.rate_date) as latest_date
FROM rates r
JOIN banks b ON r.bank_id = b.id
GROUP BY b.id, b.name
ORDER BY b.name;

-- Find exact duplicates (same bank, date, and rate values)
SELECT 
  b.name,
  r.rate_date,
  r.term_1year,
  r.term_2year,
  r.term_3year,
  r.term_5year,
  COUNT(*) as duplicate_count,
  STRING_AGG(r.id::text, ', ') as ids
FROM rates r
JOIN banks b ON r.bank_id = b.id
GROUP BY r.bank_id, b.name, r.rate_date, r.term_1year, r.term_2year, r.term_3year, r.term_5year
HAVING COUNT(*) > 1
ORDER BY b.name, r.rate_date DESC;

-- Find all rates for a specific bank
SELECT 
  r.id,
  b.name,
  r.rate_date,
  r.term_1year,
  r.term_2year,
  r.term_3year,
  r.term_5year,
  r.created_at
FROM rates r
JOIN banks b ON r.bank_id = b.id
WHERE b.name = 'ANZ'  -- Change bank name as needed
ORDER BY r.rate_date DESC
LIMIT 20;

-- Show statistics on duplicate entries
SELECT 
  COUNT(*) as total_rate_entries,
  COUNT(DISTINCT bank_id) as unique_banks,
  COUNT(DISTINCT bank_id, rate_date) as unique_bank_dates,
  COUNT(*) - COUNT(DISTINCT bank_id, rate_date) as potential_duplicates
FROM rates;

-- ============================================================================
-- SAFE CLEANUP WITH BACKUP
-- ============================================================================
-- Run these steps to safely clean up duplicates with a backup:

-- Step 1: Create backup table
-- CREATE TABLE rates_backup AS SELECT * FROM rates;

-- Step 2: View backup table
-- SELECT COUNT(*) FROM rates_backup;

-- Step 3: Run one of the DELETE options above (OPTION 1-4)

-- Step 4: Verify results
-- SELECT COUNT(*) FROM rates;

-- Step 5: If successful, drop backup (optional)
-- DROP TABLE rates_backup;

-- Step 6: If you need to restore, run:
-- DELETE FROM rates;
-- INSERT INTO rates SELECT * FROM rates_backup;

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Show rates grouped by month for each bank (summary view)
SELECT 
  b.name,
  DATE_TRUNC('month', r.rate_date)::date as month,
  COUNT(*) as entries_in_month,
  MAX(r.rate_date) as latest_in_month,
  term_1year,
  term_2year,
  term_3year,
  term_5year
FROM rates r
JOIN banks b ON r.bank_id = b.id
GROUP BY b.id, b.name, DATE_TRUNC('month', r.rate_date), 
         r.term_1year, r.term_2year, r.term_3year, r.term_5year
ORDER BY b.name, month DESC;

-- Show rate change history (latest change for each bank)
SELECT 
  b.name,
  r.rate_date as latest_update,
  r.term_1year,
  r.term_2year,
  r.term_3year,
  r.term_5year,
  CASE 
    WHEN lag(r.term_1year) OVER (PARTITION BY r.bank_id ORDER BY r.rate_date) 
         < r.term_1year THEN '↑ UP'
    WHEN lag(r.term_1year) OVER (PARTITION BY r.bank_id ORDER BY r.rate_date) 
         > r.term_1year THEN '↓ DOWN'
    ELSE '→ NO CHANGE'
  END as 1yr_trend
FROM rates r
JOIN banks b ON r.bank_id = b.id
WHERE r.rate_date = (SELECT MAX(rate_date) FROM rates WHERE bank_id = r.bank_id)
ORDER BY b.name;
