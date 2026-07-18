require('dotenv').config();
const dns = require('dns');

// Configure custom DNS override to ensure Atlas resolves
try {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch {}

const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const email = `test-${Date.now()}@example.com`;
    console.log(`Attempting to create user with email: ${email}`);
    
    const user = await User.create({
      name: 'Test User',
      email,
      password: 'password123'
    });

    console.log('User created successfully:', user);
  } catch (err) {
    console.error('Error occurred during User.create:');
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
};

run();
