# Database Cleanup Guide: Remove Duplicate Rate Entries

## Overview

This guide explains how to safely remove duplicate rate entries from the `rates` table while maintaining data integrity.

## Database Schema Context

```sql
CREATE TABLE rates (
  id SERIAL PRIMARY KEY,
  bank_id INTEGER REFERENCES banks(id),
  rate_date DATE NOT NULL,
  term_1year DECIMAL(5,3),
  term_2year DECIMAL(5,3),
  term_3year DECIMAL(5,3),
  term_5year DECIMAL(5,3),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bank_id, rate_date)  -- Ensures only one rate per bank per date
);
```

## Cleanup Strategies

### Option 1: Keep ONLY Latest Rate for Each Bank
**Use case:** You only want the most recent rate for each bank (aggressive cleanup)

```sql
DELETE FROM rates
WHERE id NOT IN (
  SELECT MAX(id)
  FROM rates
  GROUP BY bank_id
);
```

**Result:** Keeps only 1 entry per bank (the most recent)  
**Impact:** High - Removes all historical data

---

### Option 2: Remove Exact Duplicates
**Use case:** Multiple identical entries exist (same bank, date, and rate values)

```sql
DELETE FROM rates
WHERE id NOT IN (
  SELECT MIN(id)
  FROM rates
  GROUP BY bank_id, rate_date, term_1year, term_2year, term_3year, term_5year
);
```

**Result:** Keeps first entry of each unique combination  
**Impact:** Low - Only removes true duplicates

---

### Option 3: Keep One Entry Per Month (Monthly Snapshots)
**Use case:** Maintain monthly historical data instead of daily

```sql
DELETE FROM rates
WHERE id NOT IN (
  SELECT MAX(id)
  FROM rates
  GROUP BY bank_id, DATE_TRUNC('month', rate_date)::date
);
```

**Result:** Keeps latest entry for each bank-month combination  
**Impact:** Medium - Keeps monthly history, removes intra-month duplicates

---

### Option 4: Keep Last N Days of History
**Use case:** Keep recent data, remove old historical data

```sql
DELETE FROM rates
WHERE rate_date < (SELECT MAX(rate_date) - INTERVAL '90 days' FROM rates)
  AND id NOT IN (
    SELECT MAX(id)
    FROM rates
    WHERE rate_date >= (SELECT MAX(rate_date) - INTERVAL '90 days' FROM rates)
    GROUP BY bank_id, rate_date
  );
```

**Customization:** Change `'90 days'` to:
- `'30 days'` - Keep last month
- `'1 year'` - Keep last year
- `'180 days'` - Keep last 6 months

**Impact:** Medium - Balances history retention with storage

---

## Safe Cleanup Procedure

### Step 1: Check Current State

Run these queries BEFORE cleanup to see what you have:

```sql
-- Overall statistics
SELECT 
  COUNT(*) as total_entries,
  COUNT(DISTINCT bank_id) as banks,
  COUNT(DISTINCT bank_id, rate_date) as unique_combinations
FROM rates;

-- Entries per bank
SELECT 
  b.name,
  COUNT(*) as entries,
  COUNT(DISTINCT rate_date) as unique_dates,
  MIN(rate_date) as oldest,
  MAX(rate_date) as newest
FROM rates r
JOIN banks b ON r.bank_id = b.id
GROUP BY b.name
ORDER BY b.name;
```

### Step 2: Create a Backup

**ALWAYS backup before running destructive queries:**

```sql
-- Create backup table
CREATE TABLE rates_backup AS SELECT * FROM rates;

-- Verify backup
SELECT COUNT(*) FROM rates_backup;  -- Should match original count
```

### Step 3: Run Cleanup

Pick ONE of the four options above and execute it.

### Step 4: Verify Results

```sql
-- Check new count
SELECT COUNT(*) FROM rates;

-- Verify each bank has correct entries
SELECT 
  b.name,
  COUNT(*) as entries,
  COUNT(DISTINCT rate_date) as unique_dates
FROM rates r
JOIN banks b ON r.bank_id = b.id
GROUP BY b.name
ORDER BY b.name;
```

### Step 5: Restore if Needed

If something goes wrong:

```sql
-- Delete cleanup results
DELETE FROM rates;

-- Restore from backup
INSERT INTO rates SELECT * FROM rates_backup;

-- Verify restoration
SELECT COUNT(*) FROM rates;
```

### Step 6: Drop Backup (Optional)

Once you're confident:

```sql
DROP TABLE rates_backup;
```

---

## Verification Queries

### Find Exact Duplicates

```sql
SELECT 
  b.name,
  r.rate_date,
  COUNT(*) as duplicates,
  STRING_AGG(r.id::text, ', ') as ids
FROM rates r
JOIN banks b ON r.bank_id = b.id
GROUP BY r.bank_id, b.name, r.rate_date
HAVING COUNT(*) > 1;
```

### View Rates for Specific Bank

```sql
SELECT 
  id,
  rate_date,
  term_1year,
  term_2year,
  term_3year,
  term_5year,
  created_at
FROM rates
WHERE bank_id = 1  -- Change to bank ID
ORDER BY rate_date DESC
LIMIT 20;
```

### Identify Gaps in Data

```sql
SELECT 
  b.name,
  MIN(rate_date) as earliest,
  MAX(rate_date) as latest,
  EXTRACT(DAY FROM (MAX(rate_date) - MIN(rate_date))) as days_of_history,
  COUNT(DISTINCT rate_date) as unique_dates
FROM rates r
JOIN banks b ON r.bank_id = b.id
GROUP BY b.name
ORDER BY b.name;
```

---

## Recommended Strategy

For your Home Loan Compare project:

### Weekly Scraper Data:
- **Keep Option 4 with 180 days** - Maintains 6 months of history
- Clean up every month
- Storage efficient while keeping useful trends

```sql
-- Monthly cleanup: Keep last 180 days
DELETE FROM rates
WHERE rate_date < (SELECT MAX(rate_date) - INTERVAL '180 days' FROM rates)
  AND id NOT IN (
    SELECT MAX(id)
    FROM rates
    WHERE rate_date >= (SELECT MAX(rate_date) - INTERVAL '180 days' FROM rates)
    GROUP BY bank_id, rate_date
  );
```

### Long-term Archival:
- **Use Option 3 (Monthly snapshots)** - Compress historical data
- Create monthly snapshots for year-over-year comparisons

```sql
-- Convert to monthly snapshots
DELETE FROM rates
WHERE id NOT IN (
  SELECT MAX(id)
  FROM rates
  GROUP BY bank_id, DATE_TRUNC('month', rate_date)::date
);
```

---

## Important Notes

⚠️ **Before any cleanup:**
1. **ALWAYS create a backup** - See Step 2 above
2. **Test on non-production** - If possible, test procedure first
3. **Run verification queries** - Confirm results match expectations
4. **Schedule during low usage** - Run during off-peak hours

✅ **The UNIQUE constraint ensures:**
- No duplicate (bank_id, rate_date) combinations can exist
- If duplicates exist, they're from the same-day multiple entries (impossible with current constraint)
- New scraper runs will automatically replace same-day rates

---

## Monitoring After Cleanup

After cleanup, monitor for issues:

```sql
-- Check latest update time
SELECT 
  b.name,
  MAX(r.rate_date) as last_update,
  CURRENT_DATE - MAX(r.rate_date) as days_since_update
FROM rates r
JOIN banks b ON r.bank_id = b.id
GROUP BY b.name
ORDER BY days_since_update DESC;

-- Verify unique constraint is working
SELECT COUNT(*)
FROM rates
GROUP BY bank_id, rate_date
HAVING COUNT(*) > 1;
-- Should return empty result set
```

---

## FAQ

**Q: Can I run this while the scraper is running?**  
A: Not recommended. The UNIQUE constraint may prevent inserts during cleanup. Stop the scraper, run cleanup, then restart.

**Q: How often should I clean up?**  
A: If using Option 4 (retention-based), once per month is sufficient.

**Q: What if the scraper adds a new rate while cleanup is running?**  
A: The UNIQUE constraint on (bank_id, rate_date) will prevent conflicts. New rates will be inserted separately.

**Q: Can I automate this?**  
A: Yes! Create a cron job or use your database's built-in job scheduler to run cleanup on a schedule.

```bash
# Example: Run cleanup monthly (PostgreSQL pg_cron)
SELECT cron.schedule('cleanup-rates', '0 2 1 * *', 
  'DELETE FROM rates WHERE id NOT IN (SELECT MAX(id) FROM rates GROUP BY bank_id, DATE_TRUNC(''month'', rate_date)::date)'
);
```
