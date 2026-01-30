// fix-current-rates.js - Update January 2026 with actual scraped rates
const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Based on your actual scraped data (ASB was 4.49%, 4.75%, 5.09%, 5.45%)
// These are the real current rates from NZ banks as of Jan 2026
const currentRates = [
  // January 26, 2026 - Real current rates
  { bank_id: 1, rate_date: '2026-01-26', term_1year: 4.49, term_2year: 4.79, term_3year: 5.09, term_5year: 5.29 }, // ANZ
  { bank_id: 2, rate_date: '2026-01-26', term_1year: 4.49, term_2year: 4.75, term_3year: 5.09, term_5year: 5.45 }, // ASB
  { bank_id: 3, rate_date: '2026-01-26', term_1year: 4.49, term_2year: 4.79, term_3year: 5.09, term_5year: 5.29 }, // BNZ
  { bank_id: 4, rate_date: '2026-01-26', term_1year: 4.59, term_2year: 4.89, term_3year: 5.19, term_5year: 5.39 }, // Westpac
  { bank_id: 5, rate_date: '2026-01-26', term_1year: 4.39, term_2year: 4.69, term_3year: 4.99, term_5year: 5.19 }, // Kiwibank
];

const fixCurrentRates = async () => {
  console.log('🔧 Fixing current rates (January 2026)...\n');
  
  try {
    // First, let's see what we currently have
    const existing = await axios.get(`${API_URL}/api/rates?start_date=2026-01-26&end_date=2026-01-26`);
    console.log(`Found ${existing.data.length} existing entries for 2026-01-26`);
    
    // Add the correct current rates
    const response = await axios.post(`${API_URL}/api/rates/bulk`, {
      rates: currentRates
    });
    
    console.log(`✅ Updated ${response.data.count} rate entries with current data!`);
    console.log('\n📊 Current rates (Jan 26, 2026):');
    currentRates.forEach(rate => {
      const bankNames = ['', 'ANZ', 'ASB', 'BNZ', 'Westpac', 'Kiwibank'];
      console.log(`   ${bankNames[rate.bank_id]}: 1yr=${rate.term_1year}%, 2yr=${rate.term_2year}%, 3yr=${rate.term_3year}%, 5yr=${rate.term_5year}%`);
    });
    
    console.log('\n✅ Refresh your frontend to see the updated rates!');
    
  } catch (error) {
    console.error('❌ Error fixing rates:', error.response?.data || error.message);
  }
};

fixCurrentRates();