import 'dotenv/config';
import pool from './src/db.js';
import { syncLeadToHubspot } from './src/hubspotIntegration.js';

async function test() {
  console.log('Testing HubSpot sync...');
  try {
    await syncLeadToHubspot({
      name: 'Test Antigravity',
      phone: '51999888777',
      email: 'test@antigravity.test',
      interest: 'Probando desde script'
    });
    console.log('Sync executed (check hubspot or logs)');
  } catch (e) {
    console.error('Error in test:', e);
  }
  process.exit(0);
}

test();
