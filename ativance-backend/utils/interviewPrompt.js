/**
 * interviewPrompt.js
 *
 * Prompt builders for the Mock Interview Simulator.
 * Enforces JSON-only output with the structure { "question": "..." }.
 */

/**
 * buildInterviewStartPrompt(userContext, company, type)
 *
 * @param {string} userContext  Paragraph summarizing student profile
 * @param {string} company      Target company (e.g. "Google")
 * @param {string} type         Interview type ("Technical", "HR", "Behavioral")
 */
const buildInterviewStartPrompt = (userContext, company, type) => {
  return `You are a senior tech lead and engineering manager conducting a mock interview.
Target Company: ${company}
Interview Type: ${type}

Candidate Profile Context:
---
${userContext}
---

Your task is to act as the interviewer and ask exactly ONE realistic, high-quality opening question suitable for a ${type} round at ${company}.
- If Technical: Ask a coding, system design, or problem-solving question relevant to their skills.
- If Behavioral: Ask a competency question (e.g., "Tell me about a time you...") aligned with ${company}'s core principles.
- If HR: Ask a classic fit, background, or motivation question.

CRITICAL INSTRUCTIONS — READ CAREFULLY:
1. Your entire response MUST be a single valid JSON object containing exactly one field: "question".
2. Do NOT include any markdown formatting, code fences (\`\`\`), backticks, or prose before or after the JSON.
3. Do NOT add any greeting, intro, or sign-off outside the JSON.

Required JSON format:
{ "question": "Your opening interview question here." }

Return ONLY the JSON object. No other text.`;
};

/**
 * buildInterviewNextPrompt(userContext, company, type, historyText, candidateAnswer, questionCount)
 *
 * @param {string} userContext
 * @param {string} company
 * @param {string} type
 * @param {string} historyText      Formatted list of past questions and answers
 * @param {string} candidateAnswer  The candidate's latest response
 * @param {number} questionCount    How many questions have been asked so far
 */
const buildInterviewNextPrompt = (userContext, company, type, historyText, candidateAnswer, questionCount) => {
  // If we have asked 4 questions, make the 5th one a wrap-up or conclusion.
  const isWrapUp = questionCount >= 4;

  return `You are a senior tech lead and engineering manager conducting a mock interview.
Target Company: ${company}
Interview Type: ${type}

Candidate Profile Context:
---
${userContext}
---

Conversation History so far:
---
${historyText}
Candidate latest answer: "${candidateAnswer}"
---

Your task:
- Evaluate the candidate's latest answer.
${
  isWrapUp
    ? `- Formulate a wrapping-up message that concludes the interview. Thank the candidate, comment briefly on the overall discussion, and ask: "That concludes our mock interview. Do you have any questions for me?"`
    : `- Ask the next logical follow-up or a new question suitable for a ${type} round at ${company}.`
}

CRITICAL INSTRUCTIONS — READ CAREFULLY:
1. Your entire response MUST be a single valid JSON object containing exactly one field: "question".
2. Do NOT include any markdown formatting, code fences (\`\`\`), backticks, or prose before or after the JSON.

Required JSON format:
{ "question": "Your next follow-up question or wrap-up here." }

Return ONLY the JSON object. No other text.`;
};

module.exports = {
  buildInterviewStartPrompt,
  buildInterviewNextPrompt,
};
