const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Load env vars
dotenv.config();

const User = require('../models/User');
const WeeklyRoadmap = require('../models/WeeklyRoadmap');
const { generateRoadmap, toggleDayCompleted, getLatestRoadmap } = require('../controllers/roadmapController');
const { connectDB } = require('../server'); // or mongoose.connect manually

async function testRoadmap() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Create a mock user
    const mockUser = await User.findOne();
    if (!mockUser) {
        console.log("No user found in DB, please run signup test first.");
        process.exit(1);
    }

    const req = {
      user: { id: mockUser._id },
      body: {
        mode: 'topic',
        customTopic: 'Dynamic Programming',
        days: 3
      },
      params: {}
    };
    
    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log(`[Response ${this.statusCode}]`, JSON.stringify(data, null, 2));
        return data;
      }
    };

    console.log('\n--- Generating Roadmap ---');
    const result = await generateRoadmap(req, res);
    if (!result.success) {
      console.log('Failed to generate roadmap');
      process.exit(1);
    }
    
    const roadmapId = result.roadmap._id;
    console.log('\n--- Toggling Day Completed ---');
    req.params = { id: roadmapId, day: 'Day 1' };
    await toggleDayCompleted(req, res);
    
    console.log('\n--- Getting Latest Roadmap ---');
    await getLatestRoadmap(req, res);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testRoadmap();
