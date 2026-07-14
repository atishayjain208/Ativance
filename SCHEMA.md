# Ativance — MongoDB Schema (MVP)

This document defines the MongoDB collections required for the MVP. Schemas are intentionally flexible: nested objects may gain fields over time without breaking existing documents, and optional fields are noted where applicable.

All collections use MongoDB's default `_id` (`ObjectId`) as the primary key unless stated otherwise.

---

## User

Stores account credentials, profile data, and aggregated intelligence snapshots (resume, GitHub).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `name` | String | yes | Full name |
| `email` | String | yes | Unique login email (lowercase, trimmed) |
| `password` | String | yes | Bcrypt-hashed password (never returned to client) |
| `skills` | [String] | no | Self-reported or inferred skills (e.g. `"React"`, `"Python"`) |
| `education` | Object | no | Flexible education block — extend as needed |
| `education.degree` | String | no | e.g. `"B.Tech Computer Science"` |
| `education.institution` | String | no | College or university name |
| `education.graduationYear` | Number | no | Expected or actual graduation year |
| `education.*` | Mixed | no | Additional fields allowed (CGPA, branch, etc.) |
| `goals` | String | no | Career goals in free text |
| `targetCompanies` | [String] | no | Companies the student is targeting |
| `availableStudyHours` | Number | no | Weekly hours available for prep (default e.g. `10`) |
| `resumeAnalysis` | Object | no | Latest resume intelligence output (populated by Resume module) |
| `resumeAnalysis.score` | Number | no | Overall resume score (0–100) |
| `resumeAnalysis.summary` | String | no | AI-generated summary |
| `resumeAnalysis.strengths` | [String] | no | Identified strengths |
| `resumeAnalysis.improvements` | [String] | no | Suggested improvements |
| `resumeAnalysis.analyzedAt` | Date | no | When analysis was last run |
| `resumeAnalysis.*` | Mixed | no | Additional AI fields (keywords, sections, etc.) |
| `githubStats` | Object | no | Latest GitHub intelligence snapshot |
| `githubStats.username` | String | no | Linked GitHub username |
| `githubStats.totalRepos` | Number | no | Public repository count |
| `githubStats.totalStars` | Number | no | Aggregate stars across repos |
| `githubStats.topLanguages` | [String] | no | Most-used languages |
| `githubStats.activityScore` | Number | no | Derived activity/readiness score |
| `githubStats.syncedAt` | Date | no | When stats were last fetched |
| `githubStats.*` | Mixed | no | Additional metrics (contributions, pinned repos, etc.) |
| `createdAt` | Date | yes | Account creation timestamp |
| `updatedAt` | Date | no | Last profile update (optional, for future use) |

**Indexes:** unique index on `email`

**Notes:** `resumeAnalysis` and `githubStats` are embedded snapshots on the user document for quick dashboard reads. Full history (e.g. past resume uploads) can be added later as separate collections if needed.

---

## DSAProgress

Tracks a student's DSA solving progress, linked one-to-one (or one-to-many over time) with a user.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | yes | Reference to `User._id` |
| `solvedByDifficulty` | Object | no | Problem counts grouped by difficulty |
| `solvedByDifficulty.easy` | Number | no | Default `0` |
| `solvedByDifficulty.medium` | Number | no | Default `0` |
| `solvedByDifficulty.hard` | Number | no | Default `0` |
| `solvedByDifficulty.*` | Number | no | Extend with custom tiers if needed |
| `topicWiseSolved` | Object | no | Map of topic name → solved count (e.g. `{ "Arrays": 12, "DP": 5 }`) |
| `weakTopics` | [String] | no | Topics flagged as weak by AI or rules |
| `lastUpdatedAt` | Date | no | When progress was last synced or updated |
| `createdAt` | Date | yes | Document creation timestamp |

**Indexes:** index on `userId` (unique if one active progress doc per user)

**Notes:** `topicWiseSolved` uses a flexible key-value object so new topics can be added without schema migrations. A future version may store individual problem attempts in a sub-collection.

---

## WeeklyRoadmap

Stores AI-generated weekly study plans for a user.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | yes | Reference to `User._id` |
| `weekStartDate` | Date | no | Monday (or start) of the planned week |
| `weekEndDate` | Date | no | End of the planned week |
| `items` | [Object] | yes | Day-by-day plan entries |
| `items[].day` | String | yes | Day label (e.g. `"Monday"`) or ISO date string |
| `items[].focusArea` | String | yes | Area of focus (e.g. `"Arrays"`, `"Resume"`, `"System Design"`) |
| `items[].task` | String | yes | Specific task description |
| `items[].completed` | Boolean | yes | Whether the student marked it done (default `false`) |
| `items[].*` | Mixed | no | Optional extensions (duration, priority, resource links) |
| `generatedAt` | Date | no | When the roadmap was AI-generated |
| `createdAt` | Date | yes | Document creation timestamp |

**Indexes:** compound index on `{ userId: 1, weekStartDate: -1 }` for fetching latest roadmaps

**Notes:** Multiple roadmap documents per user are allowed (one per week). Older roadmaps remain for history and progress tracking.

---

## MentorChat

Stores conversation history between the student and the AI Career Mentor.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | yes | Reference to `User._id` |
| `messages` | [Object] | yes | Ordered chat messages |
| `messages[].role` | String | yes | `"user"` or `"assistant"` (extendable to `"system"` later) |
| `messages[].message` | String | yes | Message content |
| `messages[].timestamp` | Date | yes | When the message was sent |
| `messages[].*` | Mixed | no | Optional metadata (tokens, topic tags, etc.) |
| `createdAt` | Date | yes | Session/thread creation timestamp |
| `updatedAt` | Date | no | Last message timestamp |

**Indexes:** index on `{ userId: 1, updatedAt: -1 }` for loading recent sessions

**Notes:** MVP may use one document per user with an append-only `messages` array. If conversations grow large, split into multiple session documents (add `sessionId`, `title`) in a later iteration.

---

## Relationships (summary)

```
User (1) ──< (N) DSAProgress      [typically 1 active doc per user in MVP]
User (1) ──< (N) WeeklyRoadmap    [one doc per generated week]
User (1) ──< (N) MentorChat       [one doc per user or per session]
```

---

## Extension guidelines

- Prefer adding optional fields or nested keys over renaming existing ones.
- Use `Mixed` / open objects for AI-generated payloads that may evolve (e.g. `resumeAnalysis`, `githubStats`).
- Add `createdAt` / `updatedAt` consistently on new collections.
- Reference users via `userId: ObjectId` with Mongoose `ref: 'User'` when models are implemented.
