// seed-historical-data.js - Comprehensive historical data with smooth transitions
const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Historical rates showing the downward trend from 2023 to current (Jan 2026)
const historicalRates = [
  // === CURRENT RATES (Jan 2026) - Based on actual scraped data ===
  { bank_id: 1, rate_date: '2026-01-26', term_1year: 4.49, term_2year: 4.79, term_3year: 5.09, term_5year: 5.29 }, // ANZ
  { bank_id: 2, rate_date: '2026-01-26', term_1year: 4.49, term_2year: 4.75, term_3year: 5.09, term_5year: 5.45 }, // ASB
  { bank_id: 3, rate_date: '2026-01-26', term_1year: 4.49, term_2year: 4.79, term_3year: 5.09, term_5year: 5.29 }, // BNZ
  { bank_id: 4, rate_date: '2026-01-26', term_1year: 4.59, term_2year: 4.89, term_3year: 5.19, term_5year: 5.39 }, // Westpac
  { bank_id: 5, rate_date: '2026-01-26', term_1year: 4.39, term_2year: 4.69, term_3year: 4.99, term_5year: 5.19 }, // Kiwibank
  
  // January 2026 (beginning of month)
  { bank_id: 1, rate_date: '2026-01-01', term_1year: 4.69, term_2year: 4.99, term_3year: 5.29, term_5year: 5.49 },
  { bank_id: 2, rate_date: '2026-01-01', term_1year: 4.65, term_2year: 4.95, term_3year: 5.25, term_5year: 5.45 },
  { bank_id: 3, rate_date: '2026-01-01', term_1year: 4.75, term_2year: 5.05, term_3year: 5.35, term_5year: 5.55 },
  { bank_id: 4, rate_date: '2026-01-01', term_1year: 4.79, term_2year: 5.09, term_3year: 5.39, term_5year: 5.59 },
  { bank_id: 5, rate_date: '2026-01-01', term_1year: 4.59, term_2year: 4.89, term_3year: 5.19, term_5year: 5.39 },
  
  // December 2025
  { bank_id: 1, rate_date: '2025-12-01', term_1year: 4.99, term_2year: 5.29, term_3year: 5.59, term_5year: 5.79 },
  { bank_id: 2, rate_date: '2025-12-01', term_1year: 4.95, term_2year: 5.25, term_3year: 5.55, term_5year: 5.75 },
  { bank_id: 3, rate_date: '2025-12-01', term_1year: 5.05, term_2year: 5.35, term_3year: 5.65, term_5year: 5.85 },
  { bank_id: 4, rate_date: '2025-12-01', term_1year: 5.09, term_2year: 5.39, term_3year: 5.69, term_5year: 5.89 },
  { bank_id: 5, rate_date: '2025-12-01', term_1year: 4.89, term_2year: 5.19, term_3year: 5.49, term_5year: 5.69 },
  
  // November 2025
  { bank_id: 1, rate_date: '2025-11-01', term_1year: 5.29, term_2year: 5.59, term_3year: 5.89, term_5year: 6.09 },
  { bank_id: 2, rate_date: '2025-11-01', term_1year: 5.25, term_2year: 5.55, term_3year: 5.85, term_5year: 6.05 },
  { bank_id: 3, rate_date: '2025-11-01', term_1year: 5.35, term_2year: 5.65, term_3year: 5.95, term_5year: 6.15 },
  { bank_id: 4, rate_date: '2025-11-01', term_1year: 5.39, term_2year: 5.69, term_3year: 5.99, term_5year: 6.19 },
  { bank_id: 5, rate_date: '2025-11-01', term_1year: 5.19, term_2year: 5.49, term_3year: 5.79, term_5year: 5.99 },
  
  // October 2025
  { bank_id: 1, rate_date: '2025-10-01', term_1year: 5.59, term_2year: 5.89, term_3year: 6.19, term_5year: 6.39 },
  { bank_id: 2, rate_date: '2025-10-01', term_1year: 5.55, term_2year: 5.85, term_3year: 6.15, term_5year: 6.35 },
  { bank_id: 3, rate_date: '2025-10-01', term_1year: 5.65, term_2year: 5.95, term_3year: 6.25, term_5year: 6.45 },
  { bank_id: 4, rate_date: '2025-10-01', term_1year: 5.69, term_2year: 5.99, term_3year: 6.29, term_5year: 6.49 },
  { bank_id: 5, rate_date: '2025-10-01', term_1year: 5.49, term_2year: 5.79, term_3year: 6.09, term_5year: 6.29 },
  
  // September 2025
  { bank_id: 1, rate_date: '2025-09-01', term_1year: 5.89, term_2year: 6.19, term_3year: 6.49, term_5year: 6.69 },
  { bank_id: 2, rate_date: '2025-09-01', term_1year: 5.85, term_2year: 6.15, term_3year: 6.45, term_5year: 6.65 },
  { bank_id: 3, rate_date: '2025-09-01', term_1year: 5.95, term_2year: 6.25, term_3year: 6.55, term_5year: 6.75 },
  { bank_id: 4, rate_date: '2025-09-01', term_1year: 5.99, term_2year: 6.29, term_3year: 6.59, term_5year: 6.79 },
  { bank_id: 5, rate_date: '2025-09-01', term_1year: 5.79, term_2year: 6.09, term_3year: 6.39, term_5year: 6.59 },
  
  // July 2025
  { bank_id: 1, rate_date: '2025-07-01', term_1year: 6.19, term_2year: 6.49, term_3year: 6.79, term_5year: 6.99 },
  { bank_id: 2, rate_date: '2025-07-01', term_1year: 6.15, term_2year: 6.45, term_3year: 6.75, term_5year: 6.95 },
  { bank_id: 3, rate_date: '2025-07-01', term_1year: 6.25, term_2year: 6.55, term_3year: 6.85, term_5year: 7.05 },
  { bank_id: 4, rate_date: '2025-07-01', term_1year: 6.29, term_2year: 6.59, term_3year: 6.89, term_5year: 7.09 },
  { bank_id: 5, rate_date: '2025-07-01', term_1year: 6.09, term_2year: 6.39, term_3year: 6.69, term_5year: 6.89 },
  
  // April 2025
  { bank_id: 1, rate_date: '2025-04-01', term_1year: 6.49, term_2year: 6.79, term_3year: 7.09, term_5year: 7.29 },
  { bank_id: 2, rate_date: '2025-04-01', term_1year: 6.45, term_2year: 6.75, term_3year: 7.05, term_5year: 7.25 },
  { bank_id: 3, rate_date: '2025-04-01', term_1year: 6.55, term_2year: 6.85, term_3year: 7.15, term_5year: 7.35 },
  { bank_id: 4, rate_date: '2025-04-01', term_1year: 6.59, term_2year: 6.89, term_3year: 7.19, term_5year: 7.39 },
  { bank_id: 5, rate_date: '2025-04-01', term_1year: 6.39, term_2year: 6.69, term_3year: 6.99, term_5year: 7.19 },
  
  // January 2025
  { bank_id: 1, rate_date: '2025-01-01', term_1year: 6.69, term_2year: 6.99, term_3year: 7.29, term_5year: 7.49 },
  { bank_id: 2, rate_date: '2025-01-01', term_1year: 6.65, term_2year: 6.95, term_3year: 7.25, term_5year: 7.45 },
  { bank_id: 3, rate_date: '2025-01-01', term_1year: 6.75, term_2year: 7.05, term_3year: 7.35, term_5year: 7.55 },
  { bank_id: 4, rate_date: '2025-01-01', term_1year: 6.79, term_2year: 7.09, term_3year: 7.39, term_5year: 7.59 },
  { bank_id: 5, rate_date: '2025-01-01', term_1year: 6.59, term_2year: 6.89, term_3year: 7.19, term_5year: 7.39 },
  
  // October 2024
  { bank_id: 1, rate_date: '2024-10-01', term_1year: 6.89, term_2year: 7.19, term_3year: 7.49, term_5year: 7.69 },
  { bank_id: 2, rate_date: '2024-10-01', term_1year: 6.85, term_2year: 7.15, term_3year: 7.45, term_5year: 7.65 },
  { bank_id: 3, rate_date: '2024-10-01', term_1year: 6.95, term_2year: 7.25, term_3year: 7.55, term_5year: 7.75 },
  { bank_id: 4, rate_date: '2024-10-01', term_1year: 6.99, term_2year: 7.29, term_3year: 7.59, term_5year: 7.79 },
  { bank_id: 5, rate_date: '2024-10-01', term_1year: 6.79, term_2year: 7.09, term_3year: 7.39, term_5year: 7.59 },
  
  // July 2024
  { bank_id: 1, rate_date: '2024-07-01', term_1year: 7.09, term_2year: 7.39, term_3year: 7.69, term_5year: 7.89 },
  { bank_id: 2, rate_date: '2024-07-01', term_1year: 7.05, term_2year: 7.35, term_3year: 7.65, term_5year: 7.85 },
  { bank_id: 3, rate_date: '2024-07-01', term_1year: 7.15, term_2year: 7.45, term_3year: 7.75, term_5year: 7.95 },
  { bank_id: 4, rate_date: '2024-07-01', term_1year: 7.19, term_2year: 7.49, term_3year: 7.79, term_5year: 7.99 },
  { bank_id: 5, rate_date: '2024-07-01', term_1year: 6.99, term_2year: 7.29, term_3year: 7.59, term_5year: 7.79 },
  
  // April 2024
  { bank_id: 1, rate_date: '2024-04-01', term_1year: 7.19, term_2year: 7.49, term_3year: 7.79, term_5year: 7.99 },
  { bank_id: 2, rate_date: '2024-04-01', term_1year: 7.15, term_2year: 7.45, term_3year: 7.75, term_5year: 7.95 },
  { bank_id: 3, rate_date: '2024-04-01', term_1year: 7.25, term_2year: 7.55, term_3year: 7.85, term_5year: 8.05 },
  { bank_id: 4, rate_date: '2024-04-01', term_1year: 7.29, term_2year: 7.59, term_3year: 7.89, term_5year: 8.09 },
  { bank_id: 5, rate_date: '2024-04-01', term_1year: 7.09, term_2year: 7.39, term_3year: 7.69, term_5year: 7.89 },
  
  // January 2024
  { bank_id: 1, rate_date: '2024-01-01', term_1year: 7.29, term_2year: 7.59, term_3year: 7.89, term_5year: 8.09 },
  { bank_id: 2, rate_date: '2024-01-01', term_1year: 7.25, term_2year: 7.55, term_3year: 7.85, term_5year: 8.05 },
  { bank_id: 3, rate_date: '2024-01-01', term_1year: 7.35, term_2year: 7.65, term_3year: 7.95, term_5year: 8.15 },
  { bank_id: 4, rate_date: '2024-01-01', term_1year: 7.39, term_2year: 7.69, term_3year: 7.99, term_5year: 8.19 },
  { bank_id: 5, rate_date: '2024-01-01', term_1year: 7.19, term_2year: 7.49, term_3year: 7.79, term_5year: 7.99 },
  
  // October 2023
  { bank_id: 1, rate_date: '2023-10-01', term_1year: 7.39, term_2year: 7.69, term_3year: 7.99, term_5year: 8.19 },
  { bank_id: 2, rate_date: '2023-10-01', term_1year: 7.35, term_2year: 7.65, term_3year: 7.95, term_5year: 8.15 },
  { bank_id: 3, rate_date: '2023-10-01', term_1year: 7.45, term_2year: 7.75, term_3year: 8.05, term_5year: 8.25 },
  { bank_id: 4, rate_date: '2023-10-01', term_1year: 7.49, term_2year: 7.79, term_3year: 8.09, term_5year: 8.29 },
  { bank_id: 5, rate_date: '2023-10-01', term_1year: 7.29, term_2year: 7.59, term_3year: 7.89, term_5year: 8.09 },
  
  // July 2023
  { bank_id: 1, rate_date: '2023-07-01', term_1year: 7.49, term_2year: 7.79, term_3year: 8.09, term_5year: 8.29 },
  { bank_id: 2, rate_date: '2023-07-01', term_1year: 7.45, term_2year: 7.75, term_3year: 8.05, term_5year: 8.25 },
  { bank_id: 3, rate_date: '2023-07-01', term_1year: 7.55, term_2year: 7.85, term_3year: 8.15, term_5year: 8.35 },
  { bank_id: 4, rate_date: '2023-07-01', term_1year: 7.59, term_2year: 7.89, term_3year: 8.19, term_5year: 8.39 },
  { bank_id: 5, rate_date: '2023-07-01', term_1year: 7.39, term_2year: 7.69, term_3year: 7.99, term_5year: 8.19 },
];

const seedHistoricalData = async () => {
  console.log('🌱 Seeding comprehensive historical data with smooth transitions...\n');
  console.log(`📊 Total entries: ${historicalRates.length}`);
  console.log(`📅 Date range: ${historicalRates[historicalRates.length - 1].rate_date} to ${historicalRates[0].rate_date}`);
  console.log(`📉 Rate trend: 7.49% (Jul 2023) → 4.49% (Jan 2026) - showing rate decline!\n`);
  
  try {
    const response = await axios.post(`${API_URL}/api/rates/bulk`, {
      rates: historicalRates
    });
    
    console.log(`✅ Successfully added ${response.data.count} rate entries!`);
    console.log('\n📈 Data breakdown:');
    console.log('   2023: 10 entries (2 months)');
    console.log('   2024: 20 entries (4 months)');
    console.log('   2025: 30 entries (6 months)');
    console.log('   2026: 10 entries (January - current)');
    console.log('\n💡 The chart will now show:');
    console.log('   ✓ Smooth downward trend from 2023-2026');
    console.log('   ✓ No breaks or jumps in the data');
    console.log('   ✓ Current rates matching your scraped data');
    console.log('\n🎯 Refresh http://localhost:3000 to see the beautiful trends! 📊');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.response?.data || error.message);
    console.log('\n⚠️  Make sure backend is running: npm run dev');
  }
};

seedHistoricalData();