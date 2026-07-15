/**
 * buildResumeAnalysisPrompt(resumeText)
 *
 * Returns a prompt string that instructs Gemini to act as a technical recruiter
 * and analyse the provided resume text.
 *
 * The prompt is engineered to guarantee a clean, parseable JSON response:
 *   - Explicitly forbids markdown fences, prose, or any surrounding text.
 *   - Defines the exact schema with field names, types, and value constraints.
 *   - Repeats the "JSON only" instruction at the end to reinforce compliance.
 *
 * @param {string} resumeText  Raw plain text extracted from the candidate's PDF.
 * @returns {string}           The fully assembled prompt ready to send to Gemini.
 */
const buildResumeAnalysisPrompt = (resumeText) => {
  if (!resumeText || !resumeText.trim()) {
    throw new Error('resumeText must be a non-empty string.');
  }

  return `You are a senior technical recruiter and career coach with 15+ years of experience hiring software engineers at top tech companies. You are reviewing a student's resume to give them honest, detailed, and actionable feedback.

Analyse the resume text provided below and evaluate it across:
- ATS (Applicant Tracking System) compatibility and keyword density
- Technical skills coverage and relevance
- Project quality, impact statements, and use of metrics
- Education and experience presentation
- Clarity, conciseness, and formatting signals (inferred from text)
- Missing skills commonly expected for software engineering roles

CRITICAL INSTRUCTIONS — READ CAREFULLY:
1. Your entire response MUST be a single valid JSON object.
2. Do NOT include any markdown formatting, code fences (\`\`\`), backticks, or prose before or after the JSON.
3. Do NOT add any explanation, greeting, or summary outside the JSON.
4. Every field listed in the schema below is REQUIRED. Do not omit any field.
5. Arrays must contain at least one item; do not return empty arrays.

Required JSON schema (return exactly this structure):
{
  "atsScore": <integer between 0 and 100 representing overall ATS and quality score>,
  "strengths": <array of strings — specific things the candidate does well>,
  "weakPoints": <array of strings — specific gaps, vague statements, or red flags>,
  "missingSkills": <array of strings — technical skills commonly expected but absent from this resume>,
  "recommendations": <array of strings — concrete, prioritised actions the candidate should take to improve>
}

Guidelines for each field:
- "atsScore": Be honest. A typical fresh-graduate resume with no metrics scores 40-55. Strong senior resumes score 80+.
- "strengths": Be specific (e.g., "Quantified impact in the internship project with a 30% load reduction metric"), not generic.
- "weakPoints": Be direct (e.g., "Projects lack links, GitHub URLs, or live demo references", "No mention of testing practices").
- "missingSkills": Only list skills that are genuinely absent (e.g., "Docker", "CI/CD", "System design"). Do not list skills already present.
- "recommendations": Prioritise by impact. Write each recommendation as an actionable instruction (e.g., "Add quantified results to every bullet point — replace 'improved performance' with 'reduced API latency by 40%'").

Resume text to analyse:
---
${resumeText.trim()}
---

Return ONLY the JSON object. No other text.`;
};

module.exports = { buildResumeAnalysisPrompt };
