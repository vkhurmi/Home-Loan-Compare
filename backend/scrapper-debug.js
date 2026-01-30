// debug-bnz-westpac.js - Debug BNZ and Westpac
const puppeteer = require('puppeteer');

const banks = [
  { 
    name: 'BNZ', 
    url: 'https://www.bnz.co.nz/home-loans/home-loan-interest-rates' 
  },
  { 
    name: 'Westpac', 
    url: 'https://www.westpac.co.nz/home-loans-mortgages/interest-rates/' 
  }
];

const debugBank = async (bankName, url) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🏦 Debugging ${bankName}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(80));
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    console.log('Loading page...');
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('Waiting 5 seconds for dynamic content...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Screenshot
    const filename = `${bankName.toLowerCase()}-rates.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`Screenshot saved: ${filename}`);

    // Extract all tables
    const tableData = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      const allTableData = [];
      
      tables.forEach((table, tableIndex) => {
        const rows = table.querySelectorAll('tr');
        const tableRows = [];
        
        rows.forEach((row, rowIndex) => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          const rowData = cells.map(cell => cell.textContent.trim());
          if (rowData.length > 0 && rowData.some(cell => cell)) {
            tableRows.push(rowData);
          }
        });
        
        if (tableRows.length > 0) {
          allTableData.push({
            tableIndex,
            rows: tableRows.slice(0, 20) // First 20 rows
          });
        }
      });
      
      return allTableData;
    });

    console.log(`\n📊 Found ${tableData.length} tables\n`);
    tableData.forEach((table) => {
      console.log(`Table ${table.tableIndex}:`);
      table.rows.forEach((row, i) => {
        console.log(`  Row ${i}: ${row.join(' | ')}`);
      });
      console.log('');
    });

    // Try extracting rates
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
              if (idx > 0) { // Skip first column (term name)
                const text = cell.textContent.trim();
                const rateMatch = text.match(/(\d+\.\d{2})/);
                
                if (rateMatch) {
                  const rate = parseFloat(rateMatch[1]);
                  
                  if (rate > 3 && rate < 12) {
                    if (termText.includes('12 month') || termText.includes('1 year') || termText.includes('1yr')) {
                      rateData.term_1year = rateData.term_1year || rate;
                    }
                    if (termText.includes('24 month') || termText.includes('2 year') || termText.includes('2yr')) {
                      rateData.term_2year = rateData.term_2year || rate;
                    }
                    if (termText.includes('36 month') || termText.includes('3 year') || termText.includes('3yr')) {
                      rateData.term_3year = rateData.term_3year || rate;
                    }
                    if (termText.includes('60 month') || termText.includes('5 year') || termText.includes('5yr')) {
                      rateData.term_5year = rateData.term_5year || rate;
                    }
                  }
                }
              }
            });
          }
        });
      });
      
      return rateData;
    });

    console.log('✅ Extracted rates:', rates);
    console.log(`\nBrowser staying open for 30 seconds for manual inspection...`);
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await browser.close();
};

const debugAll = async () => {
  for (const bank of banks) {
    await debugBank(bank.name, bank.url);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  console.log('\n✅ Debug complete!');
};

debugAll().catch(console.error);