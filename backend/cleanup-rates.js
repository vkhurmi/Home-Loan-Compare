// cleanup-rates.js - Safe database cleanup script for duplicate rates
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Color output for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  log(`\n${'='.repeat(70)}`, 'blue');
  log(title, 'bright');
  log(`${'='.repeat(70)}\n`, 'blue');
}

// Get cleanup statistics
async function getStatistics() {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT bank_id) as unique_banks,
        COUNT(DISTINCT bank_id, rate_date) as unique_combinations,
        COUNT(*) - COUNT(DISTINCT bank_id, rate_date) as potential_duplicates,
        MIN(rate_date) as oldest_date,
        MAX(rate_date) as latest_date
      FROM rates;
    `);
    return result.rows[0];
  } catch (error) {
    log(`Error fetching statistics: ${error.message}`, 'red');
    throw error;
  }
}

// Get per-bank statistics
async function getBankStatistics() {
  try {
    const result = await pool.query(`
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
    `);
    return result.rows;
  } catch (error) {
    log(`Error fetching bank statistics: ${error.message}`, 'red');
    throw error;
  }
}

// Create backup table
async function createBackup() {
  try {
    log('Creating backup table...', 'yellow');
    await pool.query(`
      DROP TABLE IF EXISTS rates_backup_${new Date().getTime()};
    `);
    await pool.query(`
      CREATE TABLE rates_backup_${new Date().getTime()} AS SELECT * FROM rates;
    `);
    
    const backupResult = await pool.query(`
      SELECT COUNT(*) FROM rates_backup_${new Date().getTime()};
    `);
    const backupCount = backupResult.rows[0].count;
    log(`✓ Backup created with ${backupCount} entries`, 'green');
    return `rates_backup_${new Date().getTime()}`;
  } catch (error) {
    log(`Error creating backup: ${error.message}`, 'red');
    throw error;
  }
}

// Option 1: Keep only latest rate per bank
async function cleanupKeepLatestOnly() {
  const beforeStats = await getStatistics();
  log(`Total entries before cleanup: ${beforeStats.total_entries}`, 'yellow');
  
  try {
    const backup = await createBackup();
    
    log('\nRunning cleanup: Keep ONLY latest rate per bank...', 'yellow');
    const result = await pool.query(`
      DELETE FROM rates
      WHERE id NOT IN (
        SELECT MAX(id)
        FROM rates
        GROUP BY bank_id
      );
    `);
    
    const afterStats = await getStatistics();
    const deleted = beforeStats.total_entries - afterStats.total_entries;
    
    log(`\n✓ Cleanup complete!`, 'green');
    log(`  Deleted: ${deleted} entries`, 'green');
    log(`  Remaining: ${afterStats.total_entries} entries (1 per bank)`, 'green');
    log(`  Backup table: ${backup}`, 'blue');
    
    return { success: true, deleted, backupTable: backup };
  } catch (error) {
    log(`Error during cleanup: ${error.message}`, 'red');
    throw error;
  }
}

// Option 2: Remove exact duplicates
async function cleanupExactDuplicates() {
  const beforeStats = await getStatistics();
  log(`Total entries before cleanup: ${beforeStats.total_entries}`, 'yellow');
  
  try {
    const backup = await createBackup();
    
    log('\nRunning cleanup: Remove exact duplicates...', 'yellow');
    const result = await pool.query(`
      DELETE FROM rates
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM rates
        GROUP BY bank_id, rate_date, term_1year, term_2year, term_3year, term_5year
      );
    `);
    
    const afterStats = await getStatistics();
    const deleted = beforeStats.total_entries - afterStats.total_entries;
    
    log(`\n✓ Cleanup complete!`, 'green');
    log(`  Deleted: ${deleted} exact duplicates`, 'green');
    log(`  Remaining: ${afterStats.total_entries} entries`, 'green');
    log(`  Backup table: ${backup}`, 'blue');
    
    return { success: true, deleted, backupTable: backup };
  } catch (error) {
    log(`Error during cleanup: ${error.message}`, 'red');
    throw error;
  }
}

// Option 3: Keep monthly snapshots
async function cleanupKeepMonthly() {
  const beforeStats = await getStatistics();
  log(`Total entries before cleanup: ${beforeStats.total_entries}`, 'yellow');
  
  try {
    const backup = await createBackup();
    
    log('\nRunning cleanup: Keep monthly snapshots...', 'yellow');
    const result = await pool.query(`
      DELETE FROM rates
      WHERE id NOT IN (
        SELECT MAX(id)
        FROM rates
        GROUP BY bank_id, DATE_TRUNC('month', rate_date)::date
      );
    `);
    
    const afterStats = await getStatistics();
    const deleted = beforeStats.total_entries - afterStats.total_entries;
    
    log(`\n✓ Cleanup complete!`, 'green');
    log(`  Deleted: ${deleted} intra-month entries`, 'green');
    log(`  Remaining: ${afterStats.total_entries} monthly snapshots`, 'green');
    log(`  Backup table: ${backup}`, 'blue');
    
    return { success: true, deleted, backupTable: backup };
  } catch (error) {
    log(`Error during cleanup: ${error.message}`, 'red');
    throw error;
  }
}

// Option 4: Keep last N days
async function cleanupKeepLastDays(days = 90) {
  const beforeStats = await getStatistics();
  log(`Total entries before cleanup: ${beforeStats.total_entries}`, 'yellow');
  log(`Keeping data from last ${days} days`, 'yellow');
  
  try {
    const backup = await createBackup();
    
    log(`\nRunning cleanup: Keep last ${days} days...`, 'yellow');
    const result = await pool.query(`
      DELETE FROM rates
      WHERE rate_date < (SELECT MAX(rate_date) - INTERVAL '${days} days' FROM rates)
        AND id NOT IN (
          SELECT MAX(id)
          FROM rates
          WHERE rate_date >= (SELECT MAX(rate_date) - INTERVAL '${days} days' FROM rates)
          GROUP BY bank_id, rate_date
        );
    `);
    
    const afterStats = await getStatistics();
    const deleted = beforeStats.total_entries - afterStats.total_entries;
    
    log(`\n✓ Cleanup complete!`, 'green');
    log(`  Deleted: ${deleted} old entries`, 'green');
    log(`  Remaining: ${afterStats.total_entries} recent entries`, 'green');
    log(`  Backup table: ${backup}`, 'blue');
    
    return { success: true, deleted, backupTable: backup };
  } catch (error) {
    log(`Error during cleanup: ${error.message}`, 'red');
    throw error;
  }
}

// Show analysis before cleanup
async function analyzeData() {
  logHeader('DATABASE ANALYSIS');
  
  const stats = await getStatistics();
  log(`Total Entries: ${stats.total_entries}`, 'bright');
  log(`Unique Banks: ${stats.unique_banks}`, 'bright');
  log(`Unique (Bank, Date) Combinations: ${stats.unique_combinations}`, 'bright');
  log(`Potential Duplicates: ${stats.potential_duplicates}`, 'bright');
  log(`Date Range: ${stats.oldest_date} to ${stats.latest_date}`, 'bright');
  
  logHeader('PER-BANK BREAKDOWN');
  const bankStats = await getBankStatistics();
  bankStats.forEach(bank => {
    log(`${bank.name}:`, 'blue');
    log(`  Total entries: ${bank.total_entries}`);
    log(`  Unique dates: ${bank.unique_dates}`);
    log(`  Date range: ${bank.earliest_date} to ${bank.latest_date}`);
  });
}

// Main menu
async function showMenu() {
  log('\n', 'reset');
  logHeader('RATE DATABASE CLEANUP UTILITY');
  
  log('SELECT A CLEANUP OPTION:\n', 'bright');
  log('1. Analyze data (no changes)', 'yellow');
  log('2. Keep ONLY latest rate per bank (removes all history)', 'red');
  log('3. Remove exact duplicates (same bank, date, rates)', 'yellow');
  log('4. Keep monthly snapshots (1 entry per month per bank)', 'yellow');
  log('5. Keep last 30 days', 'yellow');
  log('6. Keep last 90 days (RECOMMENDED)', 'green');
  log('7. Keep last 180 days', 'yellow');
  log('0. Exit\n', 'yellow');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const option = args[0];

  try {
    // Test connection
    log('Connecting to database...', 'yellow');
    await pool.query('SELECT 1');
    log('✓ Database connected\n', 'green');

    if (option === 'analyze') {
      await analyzeData();
    } else if (option === '1') {
      await analyzeData();
    } else if (option === '2') {
      await analyzeData();
      log('\n⚠️  WARNING: This will keep ONLY the latest rate per bank!', 'red');
      log('All historical data will be deleted.\n', 'red');
      if (args[1] === '--confirm') {
        await cleanupKeepLatestOnly();
      } else {
        log('Run with --confirm flag to proceed:', 'yellow');
        log('  node cleanup-rates.js 2 --confirm\n', 'blue');
      }
    } else if (option === '3') {
      await analyzeData();
      if (args[1] === '--confirm') {
        await cleanupExactDuplicates();
      } else {
        log('\nRun with --confirm flag to proceed:', 'yellow');
        log('  node cleanup-rates.js 3 --confirm\n', 'blue');
      }
    } else if (option === '4') {
      await analyzeData();
      if (args[1] === '--confirm') {
        await cleanupKeepMonthly();
      } else {
        log('\nRun with --confirm flag to proceed:', 'yellow');
        log('  node cleanup-rates.js 4 --confirm\n', 'blue');
      }
    } else if (option === '5') {
      await analyzeData();
      if (args[1] === '--confirm') {
        await cleanupKeepLastDays(30);
      } else {
        log('\nRun with --confirm flag to proceed:', 'yellow');
        log('  node cleanup-rates.js 5 --confirm\n', 'blue');
      }
    } else if (option === '6') {
      await analyzeData();
      if (args[1] === '--confirm') {
        await cleanupKeepLastDays(90);
      } else {
        log('\nRun with --confirm flag to proceed:', 'yellow');
        log('  node cleanup-rates.js 6 --confirm\n', 'blue');
      }
    } else if (option === '7') {
      await analyzeData();
      if (args[1] === '--confirm') {
        await cleanupKeepLastDays(180);
      } else {
        log('\nRun with --confirm flag to proceed:', 'yellow');
        log('  node cleanup-rates.js 7 --confirm\n', 'blue');
      }
    } else {
      await analyzeData();
      showMenu();
      log('USAGE EXAMPLES:\n', 'bright');
      log('Analyze only (no changes):', 'blue');
      log('  node cleanup-rates.js analyze\n', 'yellow');
      log('Keep last 90 days (RECOMMENDED):', 'blue');
      log('  node cleanup-rates.js 6 --confirm\n', 'yellow');
      log('Keep monthly snapshots:', 'blue');
      log('  node cleanup-rates.js 4 --confirm\n', 'yellow');
    }

    log('\n✓ Operation completed successfully\n', 'green');
  } catch (error) {
    log(`\n✗ Error: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

module.exports = {
  getStatistics,
  getBankStatistics,
  createBackup,
  cleanupKeepLatestOnly,
  cleanupExactDuplicates,
  cleanupKeepMonthly,
  cleanupKeepLastDays,
};
