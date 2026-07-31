const fetch = require('node-fetch');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chatprex'
});

async function testSync() {
  try {
    const configRes = await pool.query("SELECT api_key FROM integrations WHERE provider = 'hubspot' LIMIT 1");
    if (configRes.rowCount === 0) return console.log('No token');
    
    const api_key = configRes.rows[0].api_key.trim();
    
    // Simulate what whatsapp.ts sends
    const leadData = {
        name: 'Test Name Meta',
        phone: '51999888777'
    };

    const properties = {
        firstname: leadData.name,
        phone: leadData.phone
    };

    // 1. Search (Will probably fail or return 0)
    console.log('Searching...');
    const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api_key}`
        },
        body: JSON.stringify({
            filterGroups: [{ filters: [{ propertyName: 'phone', operator: 'EQ', value: leadData.phone }] }]
        })
    });

    console.log('Search Status:', searchRes.status);
    if (!searchRes.ok) {
        const err = await searchRes.json().catch(()=>({}));
        console.log('Search Error:', err);
    } else {
        const data = await searchRes.json();
        console.log('Search Results:', data);
    }

    // 2. Create
    console.log('Creating...');
    const createRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api_key}`
        },
        body: JSON.stringify({ properties })
    });

    console.log('Create Status:', createRes.status);
    if (!createRes.ok) {
        const err = await createRes.json().catch(()=>({}));
        console.log('Create Error:', err);
    } else {
        const data = await createRes.json();
        console.log('Created ID:', data.id);
    }
  } catch(e) {
      console.error('Fatal error', e);
  } finally {
      pool.end();
  }
}

testSync();
