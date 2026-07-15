# Ativance — Engineering Notes & Interview Talking Points

Here are the key architectural decisions and engineering details of the **Ativance** platform. These talking points demonstrate backend hardening, defensive programming, and AI integration strategies for technical interviews.

---

## 1. Choosing Gemini AI (`gemini-1.5-flash`)
- **Talking Point**: *Why choose Gemini over GPT-4o-mini or other models for this specific use case?*
- **Engineering Justification**: 
  - **Latency and Cost Efficiency**: `gemini-1.5-flash` is optimized for high-volume, low-latency text translation and structured formatting tasks. For operations like real-time conversational chat, mock interviews, and quick analysis retries, it has roughly 1/3 of the latency of comparable models.
  - **Massive Context Window**: Gemini's native support for a large token context window ensures we can feed detailed context summaries (`buildUserContext()`) and dialogue histories without truncation issues.
  - **Native JSON support**: Built-in support for structured schema responses simplifies the mapping of text blocks into strongly-typed database models.

---

## 2. Defensive JSON Schema Parsing & Validation
- **Talking Point**: *How do you guarantee that a non-deterministic LLM output doesn't break a structured MongoDB/Mongoose database model?*
- **Engineering Justification**:
  - **Triple-Constraint Prompt Engineering**: Prompts explicitly define the JSON schema, forbid markdown wrappers (e.g. \`\`\`json), and reiterate rules at the end of the text.
  - **Cleansing & Verification Pipeline**: Responses pass through a regex sanitization wrapper (`stripFences`) before `JSON.parse()`.
  - **State-aware Auto-Retry**: If parsing fails (due to malformed JSON or prose wrappers), the system executes a single automatic fallback call appending a strict instruction: *"Your previous response failed validation. Return ONLY raw JSON matching schema."* The retry call disables rate-limiting backoffs (`skipRetry: true`) to minimize user latency.
  - **Strict Field Validation**: The parsed object's fields and array lengths are verified against the expected schema before the document is saved, returning a standard `502 Bad Gateway` if validation fails.

---

## 3. MongoDB Schema & Index Design
- **Talking Point**: *How did you balance structural flexibility (for AI-generated outputs) with query performance?*
- **Engineering Justification**:
  - **Flexible Snaps on User Doc**: A student's profile snapshot (`githubStats`, `resumeAnalysis`) uses nested objects on the `User` collection. This allows quick dashboard loads in a single read query instead of executing multi-collection joins.
  - **Structured Array Representation**: In `DSAProgress`, topic counts are stored as an array of sub-documents `[{ topic, count }]` rather than a raw key-value object map. This allows Mongoose to validate schema fields, supports MongoDB `$elemMatch` array queries, and enables indexing individual topics.
  - **Deduplication on Write**: The upsert API wraps topic updates in a `Map` that merges counts on duplicate keys, preserving document cleanliness.
  - **Uptime Performance Indices**: Added compound indices (`{ userId: 1, weekStartDate: -1 }` on `WeeklyRoadmap` and `{ userId: 1, updatedAt: -1 }` on `MentorChat`) to fetch active sessions and recent items immediately.

---

## 4. API Resilience: Hardening, Timeouts, and Backoff Retries
- **Talking Point**: *How does the backend remain resilient during network instability, rate limits, or API outages?*
- **Engineering Justification**:
  - **Hard Connection Timeouts**: All upstream API connections (Gemini, GitHub REST API) are bound to a 10–30s `AbortController` signal timeout. This prevents socket hangs from blocking Express worker threads.
  - **Rate Limit Classification & Backoff**: GitHub and Gemini errors are mapped to internal error tags. For HTTP 429 quota exceedances, `geminiClient` implements an automated retry loop (up to 2 attempts) with a linear backoff delay (8s, then 16s) to allow quota pools to reset before failing.
  - **Non-Fatal Operations**: Database updates for telemetry (e.g. logging stats or generating roadmap snapshots) are wrapped in separate try-catch blocks. If a DB save fails, the generated AI advice is still returned to the client rather than causing the API call to crash.
  - **Friendly Error Masking**: Stack traces, API endpoints, and raw response strings are logged in detail server-side for debugging, but are replaced by friendly, localized error messages at the HTTP layer to prevent information leakage.
