/**
 * Global Teardown for SMIS API Tests
 * Runs after all tests to clean up
 */

const { chromium } = require('@playwright/test');
const config = require('./api/config/test-config');

async function globalTeardown() {
  console.log('🧹 Starting SMIS API Test Suite Global Teardown');
  
  if (!config.env.cleanup) {
    console.log('⚠️ Skipping global cleanup (CLEANUP_TEST_DATA=false)');
    return;
  }
  
  // Create a browser instance for teardown
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Optional: Clean up any global test data
    console.log('🔧 Performing global cleanup...');
    
    // Add any global cleanup logic here
    // For example, cleaning up test databases, files, etc.
    
    console.log('✅ Global cleanup completed');
    
  } catch (error) {
    console.warn('⚠️ Global teardown encountered an error:', error.message);
    // Don't throw here as it might mask test failures
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global teardown completed');
}

module.exports = globalTeardown;
