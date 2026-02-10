const axios = require('axios');

const API_URL = 'https://home-loan-compare-production.up.railway.app';

const historicalRates = [
  // Current rates (Jan 2026)
  { bank_id: 1, rate_date: '2026-01-26', term_1year: 4.49, term_2year: 4.79, term_3year: 5.09, term_5year: 5.29 },
  { bank_id: 2, rate_date: '2026-01-26', term_1year: 4.49, term_2year: 4.75, term_3year: 5.09, term_5year: 5.45 },
  { bank_id: 3, rate_date: '2026-01-26', term_1year: 4.49, term_2year: 4.79, term_3year: 5.09, term_5year: 5.29 },
  { bank_id: 4, rate_date: '2026-01-26', term_1year: 4.59, term_2year: 4.89, term_3year: 5.19, term_5year: 5.39 },
  { bank_id: 5, rate_date: '2026-01-26', term_1year: 4.39, term_2year: 4.69, term_3year: 4.99, term_5year: 5.19 },
  
  // January 2026
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
  
  // October 2025
  { bank_id: 1, rate_date: '2025-10-01', term_1year: 5.59, term_2year: 5.89, term_3year: 6.19, term_5year: 6.39 },
  { bank_id: 2, rate_date: '2025-10-01', term_1year: 5.55, term_2year: 5.85, term_3year: 6.15, term_5year: 6.35 },
  { bank_id: 3, rate_date: '2025-10-01', term_1year: 5.65, term_2year: 5.95, term_3year: 6.25, term_5year: 6.45 },
  { bank_id: 4, rate_date: '2025-10-01', term_1year: 5.69, term_2year: 5.99, term_3year: 6.29, term_5year: 6.49 },
  { bank_id: 5, rate_date: '2025-10-01', term_1year: 5.49, term_2year: 5.79, term_3year: 6.09, term_5year: 6.29 },
  
  // July 2025
  { bank_id: 1, rate_date: '2025-07-01', term_1year: 6.19, term_2year: 6.49, term_3year: 6.79, term_5year: 6.99 },
  { bank_id: 2, rate_date: '2025-07-01', term_1year: 6.15, term_2year: 6.45, term_3year: 6.75, term_5year: 6.95 },
  { bank_id: 3, rate_date: '2025-07-01', term_1year: 6.25, term_2year: 6.55, term_3year: 6.85, term_5year: 7.05 },
  { bank_id: 4, rate_date: '2025-07-01', term_1year: 6.29, term_2year: 6.59, term_3year: 6.89, term_5year: 7.09 },
  { bank_id: 5, rate_date: '2025-07-01', term_1year: 6.09, term_2year: 6.39, term_3year: 6.69, term_5year: 6.89 },
];

const seedData = async () => {
  console.log('🌱 Seeding production database...\n');
  
  try {
    const response = await axios.post(`${API_URL}/api/rates/bulk`, {
      rates: historicalRates
    });
    
    console.log(`✅ Successfully added ${response.data.count} rate entries!`);
    console.log('Visit https://home-loan-compare.vercel.app to see the data!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

seedData();
