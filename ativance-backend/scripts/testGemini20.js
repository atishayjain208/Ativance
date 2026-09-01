require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const run = async () => {
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('Calling generateContent on gemini-2.0-flash...');
    const result = await model.generateContent('Say hello');
    console.log('Response text:', result.response.text());
  } catch (err) {
    console.error('SDK Call failed with gemini-2.0-flash:');
    console.error(err.message);
  }
};

run();
