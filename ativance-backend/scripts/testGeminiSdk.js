require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const run = async () => {
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    // Use gemini-3.5-flash which is the current active model in this environment
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });
    console.log('Calling generateContent on gemini-3.5-flash...');
    const result = await model.generateContent('Say hello');
    console.log('Response text:', result.response.text());
  } catch (err) {
    console.error('SDK Call failed:');
    console.error(err);
  }
};

run();
