/**
 * evaluationPrompt.js
 *
 * Prompts Gemini to perform a structured evaluation of a completed mock interview session.
 */

/**
 * buildEvaluationPrompt(company, type, historyText)
 *
 * @param {string} company      Target company (e.g. "Google")
 * @param {string} type         Interview round type ("Technical", etc.)
 * @param {string} historyText  Alternating Interviewer and Candidate messages
 */
const buildEvaluationPrompt = (company, type, historyText) => {
  return `You are a principal technical recruiter and leadership coach.
You are evaluating a completed mock interview session.

Session Details:
- Target Company: ${company}
- Round Type: ${type}

Dialogue Log:
---
${historyText}
---

Your task:
Analyze the dialogue history and score the candidate's performance. Evaluate:
1. "technicalDepth" (1 to 10): How solid were their technical explanations, problem-solving approaches, and depth of knowledge?
2. "communication" (1 to 10): How clear, concise, and structured was their verbal delivery?
3. "confidence" (1 to 10): How composed and professional was their demeanor under pressure?
4. "tips": Provide exactly one constructive, highly specific, and actionable improvement tip for each question asked by the interviewer.

CRITICAL INSTRUCTIONS — READ CAREFULLY:
1. Your entire response MUST be a single valid JSON object.
2. Do NOT include any markdown formatting, code fences (\`\`\`), backticks, or prose before or after the JSON.
3. Scores must be integers from 1 to 10.
4. The "tips" array must contain exactly one object for each question asked. Each object in the "tips" array must contain two string fields: "question" (the interviewer's question) and "tip" (your constructive recommendation).

Required JSON structure:
{
  "technicalDepth": 7,
  "communication": 8,
  "confidence": 6,
  "tips": [
    {
      "question": "Interviewer's question here...",
      "tip": "How they can improve their answer to this specific question next time..."
    }
  ]
}

Return ONLY the JSON object. No other text.`;
};

module.exports = { buildEvaluationPrompt };
