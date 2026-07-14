/**
 * scripts/testGemini.js
 *
 * Quick smoke test for the Gemini integration.
 * Run with:   node scripts/testGemini.js
 *
 * Requires GEMINI_API_KEY to be set in ativance-backend/.env
 */
require('dotenv').config();

const { generateContent } = require('../utils/geminiClient');

const PROMPT = 'In one sentence, explain what makes a strong software engineering resume.';

(async () => {
  console.log('🔍 Sending test prompt to Gemini...\n');
  console.log(`Prompt: "${PROMPT}"\n`);

  try {
    const response = await generateContent(PROMPT);
    console.log('✅ Gemini responded successfully:\n');
    console.log(response);
  } catch (err) {
    console.error('❌ Gemini test failed:', err.message);
    process.exit(1);
  }
})();
