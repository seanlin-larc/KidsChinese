// Saves learner profiles and progress in this browser (localStorage).
// Data stays on this device. Use Export / Import to move it to another device.

const KEY = 'kidschinese.v1';

const DEFAULT_SETTINGS = { maxLevel: 1, showEnglish: true, showPinyin: true, sessionSize: 10, speechRate: 0.8 };

function emptyData() {
  return { profiles: [], activeId: null };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const data = JSON.parse(raw);
    if (!Array.isArray(data.profiles)) return emptyData();
    data.profiles = data.profiles.map(normalizeProfile);
    return data;
  } catch {
    return emptyData();
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function normalizeProfile(p) {
  return {
    id: p.id,
    name: String(p.name ?? 'Player'),
    avatar: p.avatar ?? '🐼',
    settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
    progress: p.progress ?? {},
    stars: Number(p.stars ?? 0),
    streak: p.streak ?? { count: 0, last: null },
    daily: p.daily ?? { date: null, count: 0 },
  };
}

export function createProfile(name, avatar, maxLevel) {
  const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return normalizeProfile({ id, name, avatar, settings: { maxLevel } });
}

export function exportJson(data) {
  return JSON.stringify({ app: 'kidschinese', version: 1, exported: new Date().toISOString(), ...data }, null, 2);
}

export function importJson(text) {
  const data = JSON.parse(text);
  if (data.app !== 'kidschinese' || !Array.isArray(data.profiles)) {
    throw new Error('This file is not a KidsChinese backup.');
  }
  return { profiles: data.profiles.map(normalizeProfile), activeId: data.activeId ?? null };
}
