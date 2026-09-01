require('dotenv').config();
const { generateContent } = require('../utils/geminiClient');
const { buildResumeAnalysisPrompt } = require('../utils/resumePrompt');

const sampleResume = `
John Doe
Software Engineer | johndoe@gmail.com | github.com/johndoe | linkedin.com/in/johndoe

EDUCATION
Bachelor of Technology in Computer Science
XYZ University, 2022 - 2026 | CGPA: 8.5/10

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, C++, Java
Frameworks: React, Node.js, Express.js, Tailwind CSS
Databases: MongoDB, PostgreSQL
Tools: Git, GitHub, Docker, Postman

EXPERIENCE
Software Developer Intern — Tech Corp (Jan 2025 - Present)
- Developed RESTful APIs using Node.js and Express, improving response times by 25%.
- Integrated MongoDB database schemas and optimized indexing for queries.
- Built reusable frontend components in React and Tailwind CSS.

PROJECTS
E-Commerce Platform | React, Node.js, MongoDB, Stripe
- Built full-stack e-commerce web application with user authentication, product catalog, and cart.
- Integrated Stripe payment gateway for handling transactions securely.
- Deployed on Vercel and Render with CI/CD pipelines.

AI Resume Screener | Python, FastAPI, Gemini API
- Created automated resume screening tool evaluating ATS keyword matching.
`;

const run = async () => {
  console.log('Testing full resume analysis with generateContent...');
  const prompt = buildResumeAnalysisPrompt(sampleResume);
  try {
    const text = await generateContent(prompt);
    console.log('Gemini raw response:');
    console.log(text);
  } catch (err) {
    console.error('Error during generateContent:');
    console.error('Message:', err.message);
    console.error('Tag:', err._tag);
    console.error('Status:', err._status);
    console.error(err);
  }
};

run();
