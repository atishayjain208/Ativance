require('dotenv').config();
const dns = require('dns/promises');

const run = async () => {
  const key = process.env.GEMINI_API_KEY;
  console.log('Using API Key starting with:', key ? key.substring(0, 8) : 'undefined');
  console.log('Resolving DNS servers:', dns.getServers());

  try {
    console.log('Resolving generativelanguage.googleapis.com...');
    const addresses = await dns.resolve('generativelanguage.googleapis.com').catch(e => {
      console.warn('DNS resolve failed, trying lookup...');
      return dns.lookup('generativelanguage.googleapis.com').then(r => [r.address]);
    });
    console.log('Resolved IPs:', addresses);

    console.log('Making direct fetch request to Gemini API...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, respond with exactly "Gemini is online"' }] }]
      })
    });

    console.log('HTTP Status:', res.status, res.statusText);
    const body = await res.text();
    console.log('Response body:', body.substring(0, 1000));
  } catch (err) {
    console.error('Fetch execution failed:');
    console.error(err);
  }
};

run();
