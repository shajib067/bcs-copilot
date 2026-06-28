import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'daily:status';

function fmt(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function todayStr() {
  return fmt(new Date());
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return fmt(d);
}

async function read() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { lastDate: null, streak: 0 };
  } catch (e) {
    return { lastDate: null, streak: 0 };
  }
}

// { lastDate, streak, todayDone }
export async function getDailyStatus() {
  const s = await read();
  // A streak that skipped a day is stale; surface it as 0 until today is done.
  const alive = s.lastDate === todayStr() || s.lastDate === yesterdayStr();
  return { ...s, streak: alive ? s.streak : 0, todayDone: s.lastDate === todayStr() };
}

export async function completeDaily() {
  const today = todayStr();
  const s = await read();
  if (s.lastDate === today) return { ...s, todayDone: true };
  const streak = s.lastDate === yesterdayStr() ? (s.streak || 0) + 1 : 1;
  const next = { lastDate: today, streak };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    /* no-op */
  }
  return { ...next, todayDone: true };
}
