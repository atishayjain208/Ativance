require('dotenv').config();

const run = async () => {
  const key = process.env.GEMINI_API_KEY;
  console.log('Listing models for API Key starting with:', key ? key.substring(0, 8) : 'undefined');

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const res = await fetch(url);
    console.log('HTTP Status:', res.status, res.statusText);
    
    const body = await res.json();
    if (body.error) {
      console.error('API returned an error:', body.error);
    } else {
      console.log('Available Models:');
      (body.models || []).forEach(m => console.log(`- ${m.name} (${m.displayName})`));
    }
  } catch (err) {
    console.error('Failed to list models:');
    console.error(err);
  }
};

run();
