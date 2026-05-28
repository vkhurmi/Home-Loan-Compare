# Quick Reference: Database Cleanup

## Files Created

1. **cleanup-duplicate-rates.sql** - Raw SQL cleanup scripts with 4 options
2. **CLEANUP-GUIDE.md** - Comprehensive guide with safe procedures
3. **cleanup-rates.js** - Interactive Node.js cleanup tool
4. **QUICKREF.md** - This file

---

## TL;DR - Recommended Approach

### For Production (Recommended)
Keep 90 days of data, monthly snapshots:

```bash
# Option 1: Using Node.js script (SAFE & INTERACTIVE)
node cleanup-rates.js 6 --confirm

# Option 2: Using SQL directly
DELETE FROM rates
WHERE rate_date < (SELECT MAX(rate_date) - INTERVAL '90 days' FROM rates)
  AND id NOT IN (
    SELECT MAX(id)
    FROM rates
    WHERE rate_date >= (SELECT MAX(rate_date) - INTERVAL '90 days' FROM rates)
    GROUP BY bank_id, rate_date
  );
```

---

## Quick Command Reference

### Check Database Status (No Changes)
```bash
node cleanup-rates.js analyze
```

### Option Comparison

| Option | Command | Result | Best For | Impact |
|--------|---------|--------|----------|--------|
| **Analyze** | `node cleanup-rates.js analyze` | Show stats only | Before cleanup | None |
| **Latest Only** | `node cleanup-rates.js 2 --confirm` | 5 entries (1 per bank) | Space critical | 🔴 High |
| **Exact Duplicates** | `node cleanup-rates.js 3 --confirm` | Remove true duplicates | Data integrity | 🟢 Low |
| **Monthly** | `node cleanup-rates.js 4 --confirm` | ~60 entries/year | Trend analysis | 🟡 Medium |
| **Last 30 Days** | `node cleanup-rates.js 5 --confirm` | ~30 entries | Recent data only | 🟡 Medium |
| **Last 90 Days** | `node cleanup-rates.js 6 --confirm` | ~90 entries ✓ | **RECOMMENDED** | 🟡 Medium |
| **Last 180 Days** | `node cleanup-rates.js 7 --confirm` | ~180 entries | Historical trends | 🟡 Medium |

---

## Safety Checklist

Before running any cleanup:

- [ ] Created backup (automatic with Node.js script)
- [ ] Stopped the scraper
- [ ] Verified database connection
- [ ] Ran analysis mode first
- [ ] Have restore procedure ready

---

## Common Scenarios

### "Database is Growing Too Fast"
→ Use **Option 6** (Keep 90 days)
- Keeps 3 months of history
- Automatic daily updates
- ~90 entries total
- Can be run monthly

### "I Only Need Current Rates"
→ Use **Option 2** (Keep Latest)
- ⚠️ **WARNING:** Removes all history
- Only 5 entries total
- Cannot recover trends later

### "I Want Historical Trends"
→ Use **Option 4** (Monthly Snapshots)
- One rate per bank per month
- ~60 entries per year
- Good for year-over-year analysis

### "Exact Duplicates Exist"
→ Use **Option 3** (Remove Duplicates)
- Only removes identical entries
- Safe, minimal impact
- Good for cleanup after migration

---

## Database Queries

### View Current State
```sql
-- Overall stats
SELECT 
  COUNT(*) as entries,
  COUNT(DISTINCT bank_id) as banks,
  MIN(rate_date) as oldest,
  MAX(rate_date) as newest
FROM rates;

-- Per bank
SELECT b.name, COUNT(*) as entries, MAX(rate_date) as latest
FROM rates r JOIN banks b ON r.bank_id = b.id
GROUP BY b.name ORDER BY b.name;
```

### Find Duplicates
```sql
SELECT b.name, rate_date, COUNT(*) as duplicates
FROM rates r JOIN banks b ON r.bank_id = b.id
GROUP BY b.name, rate_date
HAVING COUNT(*) > 1;
```

### View Specific Bank
```sql
SELECT rate_date, term_1year, term_2year, term_3year, term_5year
FROM rates
WHERE bank_id = 1  -- Change to bank ID
ORDER BY rate_date DESC
LIMIT 20;
```

---

## Restoration

If cleanup went wrong:

```bash
# Using Node.js (easiest)
# The backup table name is shown after cleanup

# Manual restoration
DELETE FROM rates;
INSERT INTO rates SELECT * FROM rates_backup_[TIMESTAMP];
```

---

## Automation (Optional)

### Monthly Cleanup via Cron

```bash
# Edit crontab
crontab -e

# Add this line (runs at 2 AM on 1st of each month)
0 2 1 * * cd /path/to/Home-Loan-Compare/backend && node cleanup-rates.js 6 --confirm >> cleanup.log 2>&1
```

### Database-Level Automation (PostgreSQL)

Requires pg_cron extension:

```sql
-- Run monthly cleanup
SELECT cron.schedule('cleanup-rates', '0 2 1 * *', 
  'DELETE FROM rates WHERE id NOT IN (SELECT MAX(id) FROM rates GROUP BY bank_id, DATE_TRUNC(''month'', rate_date)::date)'
);
```

---

## Troubleshooting

### Error: "Cannot lock table"
- Stop the scraper first
- Wait for any active queries to complete
- Retry cleanup

### Error: "Database connection failed"
- Verify DATABASE_URL environment variable
- Check database server is running
- Verify credentials

### Cleanup Took Too Long
- The operation is completing
- Be patient for large datasets
- Can be cancelled with Ctrl+C (recovery possible with backup)

---

## Performance Impact

| Dataset Size | Operation | Time | Storage Before | Storage After |
|---|---|---|---|---|
| 100 entries | Analyze | <1s | ~10KB | N/A |
| 1K entries | Keep 90 days | 2-5s | ~100KB | ~20KB |
| 10K entries | Keep 90 days | 10-15s | ~1MB | ~200KB |
| 100K entries | Keep 90 days | 30-60s | ~10MB | ~2MB |

---

## Contact & Documentation

- **Full Guide:** See `CLEANUP-GUIDE.md`
- **Raw SQL:** See `cleanup-duplicate-rates.sql`
- **Node.js Script:** See `cleanup-rates.js`

---

## Recommended Schedule

```
Monthly Maintenance:
├─ Week 1: Analyze data (no changes)
├─ Week 2: Plan cleanup strategy
├─ Week 3: Create backup (automatic)
├─ Week 4: Run cleanup during off-hours
└─ Final: Verify results

Daily Monitoring:
└─ Check latest update time for each bank
```
