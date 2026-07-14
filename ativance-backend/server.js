require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Ativance backend server running on port ${PORT}`);
  });
};

startServer();
