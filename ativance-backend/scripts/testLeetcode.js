const { fetchLeetcodeStats } = require('../utils/leetcodeService');

const run = async () => {
  const username = 'lee215'; // Known public user

  try {
    const data = await fetchLeetcodeStats(username);
    console.log('Success! Parsed Stats:');
    console.log('Difficulty Stats:', data.solvedByDifficulty);
    console.log('Topic-wise counts:');
    data.solvedByTopic
      .filter(t => t.count > 0)
      .forEach(t => console.log(`- ${t.topic}: ${t.count}`));
  } catch (err) {
    console.error('Failed to parse:', err.message, 'Tag:', err._tag);
  }
};

run();
