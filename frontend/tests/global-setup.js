/**
 * Global Setup for SMIS API Tests
 * Runs before all tests to ensure backend is ready
 */

const { chromium } = require('@playwright/test');
const config = require('./api/config/test-config');

async function globalSetup() {
  console.log('🚀 Starting SMIS API Test Suite Global Setup');
  
  // Create a browser instance for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Check backend health
    console.log(`📡 Checking backend health at ${config.baseURL}`);
    
    const response = await page.request.get(`${config.baseURL}/health`);
    
    if (response.status() !== 200) {
      throw new Error(`Backend health check failed: ${response.status()}`);
    }
    
    console.log('✅ Backend is healthy and ready for testing');
    
    // Optional: Pre-create test data if needed
    if (process.env.SETUP_TEST_DATA === 'true') {
      console.log('🔧 Setting up test data...');
      // Add any test data setup logic here
      console.log('✅ Test data setup completed');
    }
    
  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed successfully');
}

module.exports = globalSetup;
