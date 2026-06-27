import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'bookmarks:favorites';

// Returns a Set of favorited question ids.
export async function getFavorites() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
}

export async function isFavorite(id) {
  const set = await getFavorites();
  return set.has(id);
}

// Toggles a favorite; returns the new boolean state.
export async function toggleFavorite(id) {
  const set = await getFavorites();
  let nowFav;
  if (set.has(id)) {
    set.delete(id);
    nowFav = false;
  } else {
    set.add(id);
    nowFav = true;
  }
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify([...set]));
  } catch (e) {
    /* no-op */
  }
  return nowFav;
}

export async function clearFavorites() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    /* no-op */
  }
}
