import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TEST_HISTORY: '@bcs_prep:test_history',
  ANSWERED: '@bcs_prep:answered_questions',
  CATEGORY_STATS: '@bcs_prep:category_stats',
};

// ---------- Mock test history ----------

export async function saveTestResult(result) {
  const existing = await getTestHistory();
  const next = [result, ...existing].slice(0, 100); // keep last 100
  await AsyncStorage.setItem(KEYS.TEST_HISTORY, JSON.stringify(next));
}

export async function getTestHistory() {
  const raw = await AsyncStorage.getItem(KEYS.TEST_HISTORY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function clearTestHistory() {
  await AsyncStorage.removeItem(KEYS.TEST_HISTORY);
}

// ---------- Per-question practice stats ----------
// Shape: { [questionId]: { correct, wrong, lastSeen } }

export async function recordAnswer(questionId, wasCorrect, categoryId) {
  const stats = await getAnsweredStats();
  const current = stats[questionId] || { correct: 0, wrong: 0, lastSeen: null };
  current[wasCorrect ? 'correct' : 'wrong'] += 1;
  current.lastSeen = new Date().toISOString();
  stats[questionId] = current;
  await AsyncStorage.setItem(KEYS.ANSWERED, JSON.stringify(stats));

  // Also roll up into per-category stats so weak-area recommendations
  // work across sessions without needing the question bank in memory.
  if (categoryId) {
    await bumpCategoryStat(categoryId, wasCorrect);
  }
}

export async function getAnsweredStats() {
  const raw = await AsyncStorage.getItem(KEYS.ANSWERED);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function getOverallStats() {
  const stats = await getAnsweredStats();
  let totalCorrect = 0;
  let totalWrong = 0;
  let uniqueQuestions = 0;
  for (const id in stats) {
    totalCorrect += stats[id].correct;
    totalWrong += stats[id].wrong;
    uniqueQuestions += 1;
  }
  const totalAttempts = totalCorrect + totalWrong;
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  return { totalCorrect, totalWrong, totalAttempts, uniqueQuestions, accuracy };
}

// ---------- Per-category stats (for recommendations) ----------
// Shape: { [categoryId]: { correct, wrong } }

async function bumpCategoryStat(categoryId, wasCorrect) {
  const stats = await getCategoryStats();
  const current = stats[categoryId] || { correct: 0, wrong: 0 };
  current[wasCorrect ? 'correct' : 'wrong'] += 1;
  stats[categoryId] = current;
  await AsyncStorage.setItem(KEYS.CATEGORY_STATS, JSON.stringify(stats));
}

export async function getCategoryStats() {
  const raw = await AsyncStorage.getItem(KEYS.CATEGORY_STATS);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function clearAllProgress() {
  await AsyncStorage.multiRemove([KEYS.TEST_HISTORY, KEYS.ANSWERED, KEYS.CATEGORY_STATS]);
}
