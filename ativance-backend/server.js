require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes   = require('./routes/userRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const githubRoutes = require('./routes/githubRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user',   userRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/github', githubRoutes);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Ativance backend server running on port ${PORT}`);
  });
};

startServer();
