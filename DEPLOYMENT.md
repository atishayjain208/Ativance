# Ativance Deployment Guide

This document describes how to deploy the **Ativance** platform to production. The platform is decoupled into a frontend React client (suitable for **Vercel** or **Netlify**) and a backend Node.js server (suitable for **Render**, **Railway**, or **Heroku**).

---

## 1. Frontend: Vercel

The frontend is a Vite + React application.

### Configuration settings:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install` (or automatic via package.json)

### Environment Variables:

| Variable | Scope / Format | Description |
|----------|----------------|-------------|
| `VITE_API_BASE_URL` | e.g. `https://ativance-api.onrender.com` | Base URL of the deployed backend API (omit trailing slash). If left unset, falls back to `http://localhost:5000`. |

---

## 2. Backend: Render / Railway

The backend is an Express server connected to MongoDB Atlas and Gemini AI.

### Configuration settings:
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Uptime Monitoring**: A public health check endpoint is exposed at `GET /health` which returns `200 OK`. Use this for Render/Railway's automated health checks.

### Environment Variables:

| Variable | Required | Example Value | Description |
|----------|----------|---------------|-------------|
| `PORT` | No | `5000` | Port the Express server listens on. Render/Railway automatically inject this. Defaults to `5000`. |
| `MONGO_URI` | Yes | `mongodb+srv://...` | Connection string for MongoDB Atlas database. |
| `JWT_SECRET` | Yes | `d3f82b8a7c...` | Cryptographically strong secret key used to sign and verify user JWT authentication sessions. |
| `GEMINI_API_KEY` | Yes | `AIzaSy...` | Official Google Gemini API key used to run resume review, GitHub suggestions, DSA coaching, and mock interview simulator features. |
| `GITHUB_TOKEN` | No | `ghp_...` | Optional GitHub Personal Access Token. Raises the GitHub API rate limit from 60 req/hour → 5,000 req/hour. |

---

## 3. Docker Deployment (Alternative)

A `Dockerfile` is provided in the `ativance-backend` directory.

### Build and run instructions:
```bash
# 1. Build the docker image
docker build -t ativance-backend ./ativance-backend

# 2. Run the container locally injecting environment variables
docker run -p 5000:5000 --env-file ./ativance-backend/.env ativance-backend
```
*Note: Make sure `.env` is created locally or the parameters are passed via the `-e` flag.*
