const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log("Navigating to login page...");
    await page.goto('http://localhost:3005/login', { waitUntil: 'networkidle2' });

    console.log("Typing credentials...");
    await page.type('input[type="email"]', 'vendaslachef@gmail.com');
    await page.type('input[type="password"]', 'Wanrltwaezakmi171?');

    console.log("Clicking login button...");
    await page.click('button[type="submit"]');

    console.log("Waiting for navigation...");
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

    const currentUrl = page.url();
    console.log("Navigated to:", currentUrl);

    console.log("Taking screenshot...");
    const dest = 'C:\\Users\\lala\\.gemini\\antigravity-ide\\brain\\44c522e1-8163-4031-a21e-f5144176acde\\admin_login_proof.png';
    await page.screenshot({ path: dest, fullPage: true });
    console.log("Screenshot saved to", dest);

  } catch (err) {
    console.error("Error during puppeteer execution:", err);
  } finally {
    await browser.close();
  }
})();
