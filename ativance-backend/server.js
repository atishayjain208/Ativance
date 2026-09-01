require('dotenv').config();

const dns = require('node:dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1']);
} catch (e) {
  console.warn('[server] DNS configuration notice:', e.message);
}

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes   = require('./routes/userRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const githubRoutes = require('./routes/githubRoutes');
const dsaRoutes    = require('./routes/dsaRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const interviewRoutes = require('./routes/interviewRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Health Check (Render/Railway/Docker) ──────────────────────────────────────
app.get('/health', (req, res) => {
  return res.status(200).json({
    status:    'UP',
    uptime:    process.uptime(),
    timestamp: new Date(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user',   userRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/dsa',    dsaRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/interview', interviewRoutes);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Ativance backend server running on port ${PORT}`);
  });
};

startServer();
