/**
 * leetcodeService.js
 *
 * Service to fetch problem-solving statistics directly from LeetCode
 * using their public GraphQL endpoint.
 *
 * ⚠️ NOTE ON UNOFFICIAL ENDPOINT:
 * This service uses the unofficial, undocumented LeetCode GraphQL API at https://leetcode.com/graphql.
 * Because it is not an official public API, this integration is provided on a best-effort basis
 * and may break or change without notice if LeetCode updates their gateway structure, queries,
 * or introduces rate-limiting/WAF rules (e.g., Cloudflare protections).
 */

const LEETCODE_ERRORS = {
  NOT_FOUND: 'LEETCODE_NOT_FOUND',
  PRIVATE:   'LEETCODE_PRIVATE',
  NETWORK:   'LEETCODE_NETWORK',
};

// ── Canonical mapping from LeetCode tag slugs to our DSA topic baselines ──────
const TAG_MAPPING = {
  'array':                 'Arrays',
  'string':                'Strings',
  'hash-table':            'Hashing',
  'two-pointers':          'Two Pointers',
  'sliding-window':        'Sliding Window',
  'binary-search':         'Binary Search',
  'linked-list':           'Linked Lists',
  'stack':                 'Stacks',
  'queue':                 'Queues',
  'tree':                  'Trees',
  'binary-tree':           'Trees',
  'graph':                 'Graphs',
  'recursion':             'Recursion',
  'backtracking':          'Backtracking',
  'dynamic-programming':   'Dynamic Programming',
  'greedy':                'Greedy',
  'heap-priority-queue':   'Heap',
  'trie':                  'Trie',
};

/**
 * fetchLeetcodeStats(username)
 *
 * @param {string} username  The LeetCode username to query.
 * @returns {Promise<object>} Solved counts by difficulty and topic.
 */
const fetchLeetcodeStats = async (username) => {
  if (!username || !username.trim()) {
    throw new Error('LeetCode username is required.');
  }

  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        tagProblemCounts {
          fundamental {
            tagSlug
            problemsSolved
          }
          intermediate {
            tagSlug
            problemsSolved
          }
          advanced {
            tagSlug
            problemsSolved
          }
        }
      }
    }
  `;

  let response;
  try {
    response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ query, variables: { username: username.trim() } }),
    });
  } catch (netErr) {
    console.error('[leetcodeService] Connection failed:', netErr.message);
    const err = new Error('Could not reach LeetCode. Check your connection.');
    err._tag = LEETCODE_ERRORS.NETWORK;
    throw err;
  }

  if (!response.ok) {
    console.error('[leetcodeService] Non-200 HTTP status:', response.status);
    const err = new Error('LeetCode server returned an error.');
    err._tag = LEETCODE_ERRORS.NETWORK;
    throw err;
  }

  const result = await response.json();

  // 1. Handle GraphQL errors (e.g. user does not exist)
  if (result.errors) {
    const isNotFound = result.errors.some(e => e.message?.toLowerCase().includes('user does not exist'));
    if (isNotFound) {
      const err = new Error(`LeetCode username "${username}" does not exist.`);
      err._tag = LEETCODE_ERRORS.NOT_FOUND;
      throw err;
    }
    
    console.error('[leetcodeService] GraphQL errors:', result.errors);
    const err = new Error('Failed to load LeetCode data.');
    err._tag = LEETCODE_ERRORS.NETWORK;
    throw err;
  }

  const user = result.data?.matchedUser;

  // 2. Validate user exists and has public stats
  if (!user) {
    const err = new Error(`LeetCode user "${username}" not found.`);
    err._tag = LEETCODE_ERRORS.NOT_FOUND;
    throw err;
  }

  const stats = user.submitStatsGlobal?.acSubmissionNum;
  if (!stats || !Array.isArray(stats)) {
    const err = new Error(`The LeetCode profile for "${username}" appears to be private or has no stats.`);
    err._tag = LEETCODE_ERRORS.PRIVATE;
    throw err;
  }

  // ── Parse solvedByDifficulty ────────────────────────────────────────────────
  const diffs = { easy: 0, medium: 0, hard: 0 };
  stats.forEach(({ difficulty, count }) => {
    const key = difficulty.toLowerCase();
    if (key === 'easy' || key === 'medium' || key === 'hard') {
      diffs[key] = Number(count) || 0;
    }
  });

  // ── Parse solvedByTopic (map tagSlugs to canonical names) ───────────────────
  const topicsMap = {};
  
  // Set defaults for all canonical target topics to 0
  Object.values(TAG_MAPPING).forEach(name => {
    topicsMap[name] = 0;
  });

  const categories = user.tagProblemCounts || {};
  const tagsList = [
    ...(categories.fundamental || []),
    ...(categories.intermediate || []),
    ...(categories.advanced || []),
  ];

  tagsList.forEach(({ tagSlug, problemsSolved }) => {
    const canonicalName = TAG_MAPPING[tagSlug];
    if (canonicalName) {
      topicsMap[canonicalName] += Number(problemsSolved) || 0;
    }
  });

  // Convert map to Array format [{ topic: 'Arrays', count: 12 }, ...]
  const solvedByTopic = Object.entries(topicsMap).map(([topic, count]) => ({
    topic,
    count,
  }));

  return {
    solvedByDifficulty: diffs,
    solvedByTopic,
  };
};

module.exports = { fetchLeetcodeStats, LEETCODE_ERRORS };
