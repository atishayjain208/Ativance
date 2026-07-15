# Ativance — Student Career Accelerator

Ativance is an AI-powered preparation platform designed to help computer science students close the gap between academic education and industry readiness. By combining resume intelligence, GitHub audits, DSA progress tracking, and conversational AI, the platform acts as an automated career coach that guides students toward technical excellence and mock interview mastery.

---

## 📌 Problem Statement

CS students often struggle to understand why their resumes get rejected by ATS systems, what gaps exist in their GitHub portfolios, and how to structure their study time across DSA topics. Traditional tools are fragmented: students use one platform to write resumes, another to solve coding problems, and have no way to tie their preparation together. **Ativance centralizes this preparation and uses Gemini AI to give personalized, actionable career guidance tailored to each student's profile.**

---

## 🚀 The 7 MVP Modules

1. **Authentication**: Secure JWT-based registration and login flow with Bearer token authentication header injection.
2. **Profile Management**: Customizable profile settings to log graduation goals, target companies, skills, and weekly preparation hours.
3. **Resume Analyzer**: PDF text extraction and AI audit generating ATS scores, identified strengths, skill gaps, and bulleted improvements.
4. **GitHub Analyzer**: Audit tool that calculates language distribution percentages, flags missing READMEs or descriptions, and suggests profile fixes.
5. **DSA Coach**: Track solved count stats, visualize topics on a bar chart, identify weak topics, and load AI-recommended practice problems.
6. **AI Career Mentor**: 1-on-1 career advisor chat session populated with the student's complete profile context.
7. **Mock Interview Simulator**: Realistic mock rounds (Technical, Behavioral, HR) simulating pressure with a final scorecard and question-by-question tips.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS (Vanilla utilities), Recharts (Lightweight SVG charts), Axios (Interceptors for Bearer JWT injection), React Router.
- **Backend**: Node.js, Express, MongoDB (Mongoose ODM), Multer (Multipart resume uploads), PDF-Parse (Raw text extraction).
- **Artificial Intelligence**: Google Gemini AI (`gemini-1.5-flash` via `@google/generative-ai`).

---

## 📂 Folder Structure

```
Ativance/
├── ativance-backend/
│   ├── config/             # DB connection configuration
│   ├── controllers/        # Express handlers (Auth, Resume, GitHub, DSA, Mentor, Interview)
│   ├── middleware/         # JWT verification & Multer upload buffers
│   ├── models/             # Mongoose schemas (User, DSAProgress, WeeklyRoadmap, MentorChat, etc.)
│   ├── routes/             # Protected API endpoints mapping
│   ├── utils/              # Client singletons (Gemini), prompt helpers, and analyzers
│   ├── server.js           # Server startup script
│   └── Dockerfile          # Alpine Node container recipe
├── ativance-frontend/
│   ├── src/
│   │   ├── components/     # Layout, sidebar, and navbar components
│   │   ├── pages/          # Core pages (Dashboard, Resume, GitHub, DSA, Mentor, Roadmap, etc.)
│   │   ├── services/       # Axios API client handlers
│   │   └── App.jsx         # Private routes mapping
│   └── package.json
├── DEPLOYMENT.md           # Render/Vercel variables checklist
├── NOTES.md                # Engineering talking points (interviews)
└── README.md               # Main documentation (this file)
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/your-username/Ativance.git
cd Ativance
```

### 2. Configure Backend
```bash
cd ativance-backend
npm install
```
Create a `.env` file in `ativance-backend/`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ativance
JWT_SECRET=your_jwt_signing_secret_key
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
# Optional to increase rate limit from 60 to 5,000 requests/hour:
# GITHUB_TOKEN=ghp_yourGitHubPersonalAccessToken
```
Start the backend server:
```bash
npm run dev
```

### 3. Configure Frontend
Open a new terminal session:
```bash
cd ativance-frontend
npm install
```
Create a `.env` file in `ativance-frontend/`:
```env
VITE_API_BASE_URL=http://localhost:5000
```
Start the frontend dev server:
```bash
npm run dev
```

---

## 📸 Screenshots

*Placeholder section — add screenshots of the platform here:*

| Dashboard Overview | Resume Score Ring & Gap Analysis |
|--------------------|----------------------------------|
| *[Screenshot Place]* | *[Screenshot Place]* |

| GitHub Language Distribution | DSA Collapsible Focus Cards |
|--------------------|----------------------------------|
| *[Screenshot Place]* | *[Screenshot Place]* |

| Career Mentor Thread | Interview Scorecard & Feedback |
|--------------------|----------------------------------|
| *[Screenshot Place]* | *[Screenshot Place]* |
