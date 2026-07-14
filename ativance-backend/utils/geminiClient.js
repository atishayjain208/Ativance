const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Singleton client ──────────────────────────────────────────────────────────
let _client = null;
let _model  = null;

const MODEL_NAME = 'gemini-1.5-flash'; // fast, cheap, good for text tasks

function getModel() {
  if (_model) return _model;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to your .env file before calling any AI feature.'
    );
  }

  _client = new GoogleGenerativeAI(apiKey);
  _model  = _client.getGenerativeModel({ model: MODEL_NAME });
  return _model;
}

/**
 * generateContent(prompt)
 *
 * Sends a plain text prompt to Gemini and returns the response text.
 *
 * @param {string} prompt   The prompt string to send.
 * @returns {Promise<string>}  The model's text response.
 */
const generateContent = async (prompt) => {
  const model  = getModel();
  const result = await model.generateContent(prompt);
  const text   = result.response.text();
  return text;
};

/**
 * generateContentFromParts(parts)
 *
 * Lower-level helper that accepts the Gemini `parts` array directly,
 * useful for multi-turn or structured prompts later.
 *
 * @param {Array}  parts  Array of { text: string } or inline-data parts.
 * @returns {Promise<string>}
 */
const generateContentFromParts = async (parts) => {
  const model  = getModel();
  const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
  return result.response.text();
};

module.exports = { generateContent, generateContentFromParts };
