// test-scraper.js - Simple test to see if puppeteer works
const puppeteer = require('puppeteer');

const testScrape = async () => {
  console.log('🧪 Testing Puppeteer...\n');
  
  try {
    const browser = await puppeteer.launch({
      headless: false, // Show browser
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Opening ANZ website...');
    await page.goto('https://www.anz.co.nz/personal/home-loans-mortgages/home-loan-rates/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('Page loaded! Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take screenshot
    await page.screenshot({ path: 'anz-page.png', fullPage: true });
    console.log('Screenshot saved: anz-page.png');

    // Get basic page info
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        tableCount: document.querySelectorAll('table').length,
        hasRateClass: document.querySelectorAll('[class*="rate"]').length,
        bodyText: document.body.textContent.substring(0, 500)
      };
    });

    console.log('\nPage Info:');
    console.log('Title:', pageInfo.title);
    console.log('Tables found:', pageInfo.tableCount);
    console.log('Elements with "rate" in class:', pageInfo.hasRateClass);
    console.log('\nFirst 500 chars of page:');
    console.log(pageInfo.bodyText);

    // Look for any numbers that look like rates
    const potentialRates = await page.evaluate(() => {
      const text = document.body.textContent;
      const matches = text.match(/\b\d\.\d{2}\b/g);
      return matches ? matches.slice(0, 20) : [];
    });

    console.log('\nPotential rates (X.XX format):', potentialRates);

    console.log('\n✅ Test complete! Check anz-page.png to see what the page looks like.');
    console.log('Browser will stay open for 30 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testScrape();