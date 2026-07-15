/**
 * dsaAnalyzer.js
 *
 * Rule-based weak-topic detection.
 *
 * Philosophy: keep this simple and auditable — a plain lookup table beats a
 * black-box scoring model for an MVP. Baselines can be tuned without touching
 * any other code.
 */

// ── Topic baseline table ──────────────────────────────────────────────────────
//
// Keys are the canonical topic names we expect users to report.
// The comparison is case-insensitive, so "arrays", "Arrays", "ARRAYS" all match.
//
// "solidThreshold" = minimum solved count to be considered "solid" on this topic.
// Topics absent from the user's solvedByTopic are treated as 0 solved.

const TOPIC_BASELINES = [
  { topic: 'Arrays',             solidThreshold: 10 },
  { topic: 'Strings',            solidThreshold: 8  },
  { topic: 'Hashing',            solidThreshold: 8  },
  { topic: 'Two Pointers',       solidThreshold: 8  },
  { topic: 'Sliding Window',     solidThreshold: 8  },
  { topic: 'Binary Search',      solidThreshold: 8  },
  { topic: 'Linked Lists',       solidThreshold: 8  },
  { topic: 'Stacks',             solidThreshold: 8  },
  { topic: 'Queues',             solidThreshold: 6  },
  { topic: 'Trees',              solidThreshold: 10 },
  { topic: 'Graphs',             solidThreshold: 10 },
  { topic: 'Recursion',          solidThreshold: 8  },
  { topic: 'Backtracking',       solidThreshold: 6  },
  { topic: 'Dynamic Programming',solidThreshold: 10 },
  { topic: 'Greedy',             solidThreshold: 6  },
  { topic: 'Heap',               solidThreshold: 6  },
  { topic: 'Trie',               solidThreshold: 4  },
];

/**
 * detectWeakTopics(solvedByTopic)
 *
 * Compares the user's solved counts against TOPIC_BASELINES and returns the
 * list of topics that fall below their threshold.
 *
 * Topics the user has not reported at all are included if they appear in
 * TOPIC_BASELINES (0 < threshold → always flagged as weak).
 *
 * @param {Array<{topic: string, count: number}>} solvedByTopic
 * @returns {Array<{topic: string, count: number, threshold: number, gap: number}>}
 *   Sorted by gap descending (biggest shortfall first).
 */
const detectWeakTopics = (solvedByTopic = []) => {
  // Build a lookup map: canonical-lowercase → solved count
  const solved = new Map();
  for (const { topic, count } of solvedByTopic) {
    solved.set(topic.trim().toLowerCase(), count);
  }

  const weak = [];

  for (const { topic, solidThreshold } of TOPIC_BASELINES) {
    const count = solved.get(topic.toLowerCase()) ?? 0;
    if (count < solidThreshold) {
      weak.push({
        topic,
        count,
        threshold: solidThreshold,
        gap: solidThreshold - count,  // how many more problems to reach "solid"
      });
    }
  }

  // Biggest gaps first — these are the highest-priority topics to study
  return weak.sort((a, b) => b.gap - a.gap);
};

module.exports = { detectWeakTopics, TOPIC_BASELINES };
