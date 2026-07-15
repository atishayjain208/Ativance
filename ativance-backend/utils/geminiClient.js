const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Constants ─────────────────────────────────────────────────────────────────
const MODEL_NAME          = 'gemini-1.5-flash';
const TIMEOUT_MS          = 30_000;   // 30 s — abort if Gemini stalls
const RATE_LIMIT_DELAY_MS = 8_000;    // wait 8 s before retrying a 429
const MAX_RATE_RETRIES    = 2;        // retry at most twice on rate limit

// ── Singleton model ───────────────────────────────────────────────────────────
let _model = null;

/**
 * Classify an error thrown by the Gemini SDK into a typed internal error
 * so callers can branch on a single string tag instead of regex-matching messages.
 *
 * Tags:
 *   'INVALID_KEY'   – API key missing, invalid, or revoked
 *   'RATE_LIMIT'    – HTTP 429 / quota exceeded
 *   'TIMEOUT'       – request exceeded TIMEOUT_MS
 *   'NETWORK'       – fetch/connection failure
 *   'AI_ERROR'      – other Gemini / SDK error
 */
const classifyError = (err) => {
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.httpStatus || err.code;

  if (!process.env.GEMINI_API_KEY || msg.includes('api key') || msg.includes('api_key') ||
      msg.includes('unauthorized') || msg.includes('permission denied') || status === 401 || status === 403) {
    return 'INVALID_KEY';
  }
  if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')) {
    return 'RATE_LIMIT';
  }
  if (err.name === 'AbortError' || msg.includes('timed out') || msg.includes('timeout') || msg.includes('aborted')) {
    return 'TIMEOUT';
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('econnrefused') ||
      msg.includes('enotfound') || msg.includes('socket')) {
    return 'NETWORK';
  }
  return 'AI_ERROR';
};

/** Resolve the status code + friendly message a controller should return for a classified error. */
const errorResponse = (tag) => {
  switch (tag) {
    case 'INVALID_KEY':
      return { status: 500, message: 'AI service is misconfigured. Please contact support.' };
    case 'RATE_LIMIT':
      return { status: 429, message: 'AI service is busy right now. Please wait a moment and try again.' };
    case 'TIMEOUT':
      return { status: 504, message: 'The AI took too long to respond. Please try again.' };
    case 'NETWORK':
      return { status: 502, message: 'Could not reach the AI service. Check your connection and try again.' };
    default:
      return { status: 502, message: 'AI service is temporarily unavailable. Please try again shortly.' };
  }
};

/** Simple async sleep helper for backoff. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Initialise (or return cached) Gemini model, validating the key at startup. */
function getModel() {
  if (_model) return _model;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === '<your_google_gemini_api_key>') {
    const err = new Error('GEMINI_API_KEY is not set or is still a placeholder. Add your real key to .env.');
    err._tag = 'INVALID_KEY';
    throw err;
  }

  const client = new GoogleGenerativeAI(apiKey);
  _model = client.getGenerativeModel({ model: MODEL_NAME });
  return _model;
}

/**
 * generateContent(prompt, options)
 *
 * Sends a text prompt to Gemini with:
 *   - A hard 30-second AbortController timeout
 *   - Up to MAX_RATE_RETRIES automatic retries with backoff on HTTP 429
 *   - Typed errors (._tag) so callers can respond without string matching
 *
 * @param {string}  prompt
 * @param {object}  [options]
 * @param {number}  [options.timeoutMs]     Override default timeout (ms).
 * @param {boolean} [options.skipRetry]     If true, never retry on rate limit.
 * @returns {Promise<string>}  Model's text response.
 * @throws  Error with ._tag set to one of the classified tags above.
 */
const generateContent = async (prompt, options = {}) => {
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  const model     = getModel();

  let attempt = 0;

  while (true) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await model.generateContent(prompt, {
        signal: controller.signal,
      });

      clearTimeout(timer);
      const text = result.response.text();

      if (!text || !text.trim()) {
        const err = new Error('Gemini returned an empty response.');
        err._tag = 'AI_ERROR';
        throw err;
      }

      return text;

    } catch (err) {
      clearTimeout(timer);

      const tag = err._tag || classifyError(err);

      // Rate limit: back off and retry (unless caller opted out or we've exhausted retries)
      if (tag === 'RATE_LIMIT' && !options.skipRetry && attempt <= MAX_RATE_RETRIES) {
        const delay = RATE_LIMIT_DELAY_MS * attempt; // 8 s, then 16 s
        console.warn(`[geminiClient] Rate limited. Retrying in ${delay / 1000}s (attempt ${attempt}/${MAX_RATE_RETRIES})…`);
        await sleep(delay);
        continue; // retry the while loop
      }

      // Log the real error internally, re-throw typed version
      console.error(`[geminiClient] Error (tag=${tag}, attempt=${attempt}):`, err.message);
      const typedErr = new Error(errorResponse(tag).message);
      typedErr._tag    = tag;
      typedErr._status = errorResponse(tag).status;
      throw typedErr;
    }
  }
};

/**
 * generateContentFromParts(parts, options)
 *
 * Lower-level helper for multi-turn / structured prompts.
 * Applies the same timeout + retry logic as generateContent.
 *
 * @param {Array}   parts   Array of { text } or inline-data part objects.
 * @param {object}  [options]
 */
const generateContentFromParts = async (parts, options = {}) => {
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  const model     = getModel();

  let attempt = 0;

  while (true) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await model.generateContent(
        { contents: [{ role: 'user', parts }] },
        { signal: controller.signal }
      );

      clearTimeout(timer);
      return result.response.text();

    } catch (err) {
      clearTimeout(timer);
      const tag = err._tag || classifyError(err);

      if (tag === 'RATE_LIMIT' && !options.skipRetry && attempt <= MAX_RATE_RETRIES) {
        const delay = RATE_LIMIT_DELAY_MS * attempt;
        console.warn(`[geminiClient] Rate limited (parts). Retrying in ${delay / 1000}s…`);
        await sleep(delay);
        continue;
      }

      console.error(`[geminiClient] Parts error (tag=${tag}):`, err.message);
      const typedErr = new Error(errorResponse(tag).message);
      typedErr._tag    = tag;
      typedErr._status = errorResponse(tag).status;
      throw typedErr;
    }
  }
};

// Expose the error response mapper so controllers can reuse it
module.exports = { generateContent, generateContentFromParts, errorResponse };
