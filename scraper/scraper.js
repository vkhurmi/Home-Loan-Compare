// scraper.js - Web scraper for NZ bank rates (Updated for modern Puppeteer)
const puppeteer = require('puppeteer');
const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL;
const MAX_API_RETRIES = process.env.SCRAPER_API_RETRIES ? parseInt(process.env.SCRAPER_API_RETRIES, 10) : 3;
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.SKIP_SAVE === '1';

// Helper function to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Bank-specific scraping configurations
const bankScrapers = {
  ANZ: async (page) => {
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log('  Loading ANZ page...');
      await page.goto('https://www.anz.co.nz/personal/home-loans-mortgages/loan-types/rates/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      await sleep(5000);

      const rates = await page.evaluate(() => {
        const rateData = {};
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
          const rows = table.querySelectorAll('tr');
          
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length >= 2) {
              const termText = cells[0]?.textContent?.toLowerCase() || '';
              const cellTexts = cells.map(c => c.textContent);
              
              cellTexts.forEach(cellText => {
                const rateMatch = cellText.match(/(\d+\.\d{2})/);
                if (rateMatch) {
                  const rate = parseFloat(rateMatch[1]);
                  
                  if (rate > 3 && rate < 15) {
                    if (termText.includes('1 year') || termText.includes('12 month')) {
                      rateData.term_1year = rateData.term_1year || rate;
                    } else if (termText.includes('2 year') || termText.includes('24 month')) {
                      rateData.term_2year = rateData.term_2year || rate;
                    } else if (termText.includes('3 year') || termText.includes('36 month')) {
                      rateData.term_3year = rateData.term_3year || rate;
                    } else if (termText.includes('5 year') || termText.includes('60 month')) {
                      rateData.term_5year = rateData.term_5year || rate;
                    }
                  }
                }
              });
            }
          });
        });
        
        return rateData;
      });

      console.log('  Raw rates found:', rates);
      return rates;
    } catch (error) {
      console.error('  ANZ scraping error:', error && error.stack ? error.stack : error);
      return null;
    }
  },

  ASB: async (page) => {
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log('  Loading ASB page...');
      await page.goto('https://www.asb.co.nz/home-loans-mortgages/interest-rates-fees.html', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await sleep(5000);

      const rates = await page.evaluate(() => {
        const rateData = {};
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
          const rows = table.querySelectorAll('tr');
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length >= 2) {
              const termText = cells[0]?.textContent.toLowerCase().trim() || '';
              const rateText = cells[1]?.textContent.trim() || '';
              
              const rateMatch = rateText.match(/(\d+\.\d{2})/);
              
              if (rateMatch) {
                const rate = parseFloat(rateMatch[1]);
                
                if (rate > 3 && rate < 12) {
                  if (termText.includes('12 month') || termText === '12 month') {
                    rateData.term_1year = rate;
                  } else if (termText.includes('24 month') || termText === '24 month') {
                    rateData.term_2year = rate;
                  } else if (termText.includes('36 month') || termText === '36 month') {
                    rateData.term_3year = rate;
                  } else if (termText.includes('60 month') || termText === '60 month') {
                    rateData.term_5year = rate;
                  } else if (termText.includes('1 year')) {
                    rateData.term_1year = rate;
                  } else if (termText.includes('2 year')) {
                    rateData.term_2year = rate;
                  } else if (termText.includes('3 year')) {
                    rateData.term_3year = rate;
                  } else if (termText.includes('5 year')) {
                    rateData.term_5year = rate;
                  }
                }
              }
            }
          });
        });
        
        return rateData;
      });

      console.log('  Raw rates found:', rates);
      return rates;
    } catch (error) {
      console.error('  ASB scraping error:', error && error.stack ? error.stack : error);
      return null;
    }
  },

  BNZ: async (page) => {
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log('  Loading BNZ page...');
      await page.goto('https://www.bnz.co.nz/personal-banking/home-loans/compare-bnz-home-loan-rates', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await sleep(5000);

      const rates = await page.evaluate(() => {
        const rateData = {};
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
          const rows = table.querySelectorAll('tr');
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length >= 2) {
              const termText = cells[0]?.textContent.toLowerCase().trim() || '';
              
              cells.forEach((cell, idx) => {
                if (idx > 0) {
                  const text = cell.textContent.trim();
                  const rateMatch = text.match(/(\d+\.\d{2})/);
                  
                  if (rateMatch) {
                    const rate = parseFloat(rateMatch[1]);
                    
                    if (rate > 3 && rate < 12) {
                      if (termText.includes('12 month') || termText.includes('1 year') || termText.includes('1yr')) {
                        rateData.term_1year = rateData.term_1year || rate;
                      } else if (termText.includes('24 month') || termText.includes('2 year') || termText.includes('2yr')) {
                        rateData.term_2year = rateData.term_2year || rate;
                      } else if (termText.includes('36 month') || termText.includes('3 year') || termText.includes('3yr')) {
                        rateData.term_3year = rateData.term_3year || rate;
                      } else if (termText.includes('60 month') || termText.includes('5 year') || termText.includes('5yr')) {
                        rateData.term_5year = rateData.term_5year || rate;
                      }
                    }
                  }
                }
              });
            }
          });
        });
        
        // Fallback
        if (Object.keys(rateData).length === 0) {
          const bodyText = document.body.innerText;
          const lines = bodyText.split('\n');
          
          lines.forEach(line => {
            const lower = line.toLowerCase();
            const rateMatch = line.match(/(\d+\.\d{2})/);
            
            if (rateMatch) {
              const rate = parseFloat(rateMatch[1]);
              if (rate > 3 && rate < 12) {
                if (lower.includes('1 year') || lower.includes('12 month')) {
                  rateData.term_1year = rateData.term_1year || rate;
                }
                if (lower.includes('2 year') || lower.includes('24 month')) {
                  rateData.term_2year = rateData.term_2year || rate;
                }
                if (lower.includes('3 year') || lower.includes('36 month')) {
                  rateData.term_3year = rateData.term_3year || rate;
                }
                if (lower.includes('5 year') || lower.includes('60 month')) {
                  rateData.term_5year = rateData.term_5year || rate;
                }
              }
            }
          });
        }
        
        return rateData;
      });

      console.log('  Raw rates found:', rates);
      return rates;
    } catch (error) {
      console.error('  BNZ scraping error:', error && error.stack ? error.stack : error);
      return null;
    }
  },

  Westpac: async (page) => {
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log('  Loading Westpac page...');
      await page.goto('https://www.westpac.co.nz/home-loans-mortgages/interest-rates/', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await sleep(5000);

      const rates = await page.evaluate(() => {
        const rateData = {};
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
          const rows = table.querySelectorAll('tr');
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length >= 2) {
              const termText = cells[0]?.textContent.toLowerCase().trim() || '';
              
              cells.forEach((cell, idx) => {
                if (idx > 0) {
                  const text = cell.textContent.trim();
                  const rateMatch = text.match(/(\d+\.\d{2})/);
                  
                  if (rateMatch) {
                    const rate = parseFloat(rateMatch[1]);
                    
                    if (rate > 3 && rate < 12) {
                      if (termText.includes('12 month') || termText.includes('1 year') || termText.includes('1yr')) {
                        rateData.term_1year = rateData.term_1year || rate;
                      } else if (termText.includes('24 month') || termText.includes('2 year') || termText.includes('2yr')) {
                        rateData.term_2year = rateData.term_2year || rate;
                      } else if (termText.includes('36 month') || termText.includes('3 year') || termText.includes('3yr')) {
                        rateData.term_3year = rateData.term_3year || rate;
                      } else if (termText.includes('60 month') || termText.includes('5 year') || termText.includes('5yr')) {
                        rateData.term_5year = rateData.term_5year || rate;
                      }
                    }
                  }
                }
              });
            }
          });
        });
        
        // Fallback
        if (Object.keys(rateData).length === 0) {
          const bodyText = document.body.innerText;
          const lines = bodyText.split('\n');
          
          lines.forEach(line => {
            const lower = line.toLowerCase();
            const rateMatch = line.match(/(\d+\.\d{2})/);
            
            if (rateMatch) {
              const rate = parseFloat(rateMatch[1]);
              if (rate > 3 && rate < 12) {
                if (lower.includes('1 year') || lower.includes('12 month')) {
                  rateData.term_1year = rateData.term_1year || rate;
                }
                if (lower.includes('2 year') || lower.includes('24 month')) {
                  rateData.term_2year = rateData.term_2year || rate;
                }
                if (lower.includes('3 year') || lower.includes('36 month')) {
                  rateData.term_3year = rateData.term_3year || rate;
                }
                if (lower.includes('5 year') || lower.includes('60 month')) {
                  rateData.term_5year = rateData.term_5year || rate;
                }
              }
            }
          });
        }
        
        return rateData;
      });

      console.log('  Raw rates found:', rates);
      return rates;
    } catch (error) {
      console.error('  Westpac scraping error:', error && error.stack ? error.stack : error);
      return null;
    }
  },

  Kiwibank: async (page) => {
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log('  Loading Kiwibank page...');
      await page.goto('https://www.kiwibank.co.nz/personal-banking/home-loans/rates-and-fees/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      await sleep(5000);

      const rates = await page.evaluate(() => {
        const rateData = {};
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
          const rows = table.querySelectorAll('tr');
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length >= 2) {
              const term = cells[0]?.textContent.toLowerCase() || '';
              const cellTexts = cells.map(c => c.textContent);
              
              cellTexts.forEach(cellText => {
                const rateMatch = cellText.match(/(\d+\.\d{2})/);
                if (rateMatch) {
                  const rate = parseFloat(rateMatch[1]);
                  if (rate > 3 && rate < 15) {
                    if (term.includes('1 year')) rateData.term_1year = rateData.term_1year || rate;
                    if (term.includes('2 year')) rateData.term_2year = rateData.term_2year || rate;
                    if (term.includes('3 year')) rateData.term_3year = rateData.term_3year || rate;
                    if (term.includes('5 year')) rateData.term_5year = rateData.term_5year || rate;
                  }
                }
              });
            }
          });
        });
        
        return rateData;
      });

      console.log('  Raw rates found:', rates);
      return rates;
    } catch (error) {
      console.error('  Kiwibank scraping error:', error && error.stack ? error.stack : error);
      return null;
    }
  }
};

// Get bank ID from API
const getBankId = async (bankName) => {
  if (DRY_RUN) {
    console.log(`  DRY_RUN enabled - skipping getBankId for ${bankName}`);
    return null;
  }

  let lastErr;
  for (let attempt = 1; attempt <= MAX_API_RETRIES; attempt++) {
    try {
      console.log(`  getBankId: fetching banks (attempt ${attempt}/${MAX_API_RETRIES})`);
      const response = await axios.get(`${API_URL}/api/banks`, { timeout: 15000 });
      const bank = response.data.find(b => b.name === bankName);
      return bank ? bank.id : null;
    } catch (error) {
      lastErr = error;
      console.error(`  getBankId attempt ${attempt} failed:`, error && error.stack ? error.stack : error);
      if (error && error.code) console.error('   Error code:', error.code);
      if (error && error.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', JSON.stringify(error.response.data));
      }

      if (attempt < MAX_API_RETRIES) {
        const backoff = 1000 * Math.pow(2, attempt - 1);
        console.log(`   Retrying after ${backoff}ms...`);
        await sleep(backoff);
      }
    }
  }

  console.error('  getBankId: all attempts failed');
  if (lastErr) {
    console.error(lastErr && lastErr.stack ? lastErr.stack : lastErr);
  }
  return null;
};

// Save rates to API
const saveRates = async (bankId, rates) => {
  if (DRY_RUN) {
    console.log(`  DRY_RUN enabled - not saving rates for bank ID ${bankId}. Rates:`, rates);
    return { dryRun: true };
  }

  let lastErr;
  const today = new Date().toISOString().split('T')[0];
  const rateData = {
    bank_id: bankId,
    rate_date: today,
    ...rates
  };

  for (let attempt = 1; attempt <= MAX_API_RETRIES; attempt++) {
    try {
      console.log(`  saveRates: posting rates for bank ${bankId} (attempt ${attempt}/${MAX_API_RETRIES})`);
      const response = await axios.post(`${API_URL}/api/rates`, rateData, { timeout: 15000 });
      console.log(`  ✓ Saved rates for bank ID ${bankId}`);
      return response.data;
    } catch (error) {
      lastErr = error;
      console.error(`  saveRates attempt ${attempt} failed:`, error && error.stack ? error.stack : error);
      if (error && error.code) console.error('   Error code:', error.code);
      if (error && error.response) {
        console.error('   Response status:', error.response.status);
        try {
          console.error('   Response data:', JSON.stringify(error.response.data));
        } catch (jsonErr) {
          console.error('   Response data (raw):', error.response.data);
        }
      }

      if (attempt < MAX_API_RETRIES) {
        const backoff = 1000 * Math.pow(2, attempt - 1);
        console.log(`   Retrying after ${backoff}ms...`);
        await sleep(backoff);
      }
    }
  }

  console.error('  saveRates: all attempts failed');
  if (lastErr) console.error(lastErr && lastErr.stack ? lastErr.stack : lastErr);
  return null;
};

// Main scraping function
const scrapeAllBanks = async () => {
  console.log('🚀 Starting rate scraping...\n');
  console.log('Environment: NODE_VERSION=%s, API_URL=%s, CI=%s', process.version, API_URL, process.env.CI || 'false');
  console.log('Puppeteer env vars: PUPPETEER_EXECUTABLE_PATH=%s, CHROME_BIN=%s, CHROME_PATH=%s', process.env.PUPPETEER_EXECUTABLE_PATH || '', process.env.CHROME_BIN || '', process.env.CHROME_PATH || '');

  if (!API_URL && !DRY_RUN) {
    console.error('Missing API_URL. Set API_URL env or use DRY_RUN=1 to skip API calls.');
    throw new Error('API_URL is required');
  }
  
  // Robust Puppeteer launch with retries and helpful logging for CI environments
  const defaultLaunchOpts = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  };

  const tryLaunch = async (opts) => {
    console.log('Launching Puppeteer with options:', {
      headless: opts.headless,
      hasExecutablePath: !!opts.executablePath,
      args: opts.args && opts.args.length
    });

    try {
      return await puppeteer.launch(opts);
    } catch (err) {
      console.error('Puppeteer launch error:', err && err.stack ? err.stack : err);
      throw err;
    }
  };

  let browser;
  try {
    browser = await tryLaunch(defaultLaunchOpts);
  } catch (firstErr) {
    // Retry with environment-provided Chrome/Chromium binary if available
    const execPath = process.env.CHROME_BIN || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
    if (execPath) {
      console.log('Retrying Puppeteer launch with executablePath from env:', execPath);
      try {
        browser = await tryLaunch(Object.assign({}, defaultLaunchOpts, { executablePath: execPath }));
      } catch (secondErr) {
        console.error('Puppeteer retry with executablePath failed:', secondErr && secondErr.stack ? secondErr.stack : secondErr);
        throw secondErr;
      }
    } else {
      // Final fallback: try headless boolean and no sandbox args removed
      console.log('No executablePath found in environment; retrying with headless:true fallback');
      try {
        const fallbackOpts = Object.assign({}, defaultLaunchOpts, { headless: true });
        browser = await tryLaunch(fallbackOpts);
      } catch (thirdErr) {
        console.error('All Puppeteer launch attempts failed. See logs for details.');
        throw thirdErr;
      }
    }
  }

  const results = [];

  for (const [bankName, scraper] of Object.entries(bankScrapers)) {
    console.log(`📊 Scraping ${bankName}...`);
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
      const rates = await scraper(page);
      
      if (rates && Object.keys(rates).length > 0) {
        console.log(`  ✓ Found rates:`, rates);
        if (DRY_RUN) {
          console.log(`  DRY_RUN enabled - skipping API calls for ${bankName}`);
          results.push({ bank: bankName, success: true, rates, dryRun: true });
        } else {
          const bankId = await getBankId(bankName);
          if (bankId) {
            const saved = await saveRates(bankId, rates);
            results.push({ bank: bankName, success: !!saved, rates });
          } else {
            console.log(`  ⚠ Bank ${bankName} not found in database`);
            results.push({ bank: bankName, success: false, error: 'Bank not found' });
          }
        }
      } else {
        console.log(`  ⚠ No rates found for ${bankName}`);
        results.push({ bank: bankName, success: false, error: 'No rates found' });
      }
    } catch (error) {
      console.error(`  ✗ Error scraping ${bankName}:`, error && error.stack ? error.stack : error);
      results.push({ bank: bankName, success: false, error: error && error.message ? error.message : String(error) });
    } finally {
      await page.close();
    }
    
    await sleep(3000);
  }

  await browser.close();

  console.log('\n📈 Scraping Summary:');
  console.log(`Total banks: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  
  return results;
};

// Schedule daily scraping at 9 AM NZST
const scheduleDailyScrape = () => {
  const now = new Date();
  const nzTime = new Date(now.toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }));
  
  const targetTime = new Date(nzTime);
  targetTime.setHours(9, 0, 0, 0);
  
  if (targetTime <= nzTime) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  const msUntilTarget = targetTime - nzTime;
  
  console.log(`Next scrape scheduled for: ${targetTime.toLocaleString('en-NZ')}`);
  
  setTimeout(() => {
    scrapeAllBanks();
    setInterval(scrapeAllBanks, 24 * 60 * 60 * 1000);
  }, msUntilTarget);
};

// Run immediately if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--now')) {
    scrapeAllBanks().then(() => {
      if (!args.includes('--schedule')) {
        process.exit(0);
      }
    });
  }
  
  if (args.includes('--schedule')) {
    console.log('📅 Starting scheduled scraper...');
    scheduleDailyScrape();
  }
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scraper.js --now          Run scraping immediately');
    console.log('  node scraper.js --schedule     Run on schedule (daily at 9 AM)');
    console.log('  node scraper.js --now --schedule   Run now and then schedule');
  }
}

module.exports = { scrapeAllBanks, scheduleDailyScrape };