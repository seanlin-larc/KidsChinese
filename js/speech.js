// Read words aloud with the browser's built-in text-to-speech.
// Prefers a Taiwan Mandarin voice (zh-TW), then any Mandarin voice.
// Cantonese voices (zh-HK, yue) are skipped.

let voices = [];

function refresh() {
  if (typeof speechSynthesis === 'undefined') return;
  voices = speechSynthesis.getVoices();
}

if (typeof speechSynthesis !== 'undefined') {
  refresh();
  speechSynthesis.addEventListener?.('voiceschanged', refresh);
}

export function pickVoice(list = voices) {
  const lang = (v) => v.lang.toLowerCase().replace('_', '-');
  const isCantonese = (v) => /zh-hk|yue/.test(lang(v)) || /cantonese|粵/i.test(v.name);
  const mandarin = list.filter((v) => (lang(v).startsWith('zh') || lang(v).startsWith('cmn')) && !isCantonese(v));
  return mandarin.find((v) => /tw|hant/.test(lang(v))) ?? mandarin[0] ?? null;
}

export function canSpeak() {
  return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function hasMandarinVoice() {
  refresh();
  return pickVoice() !== null;
}

export function speak(text, rate = 0.8) {
  if (!canSpeak()) return false;
  refresh();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? 'zh-TW';
  u.rate = rate;
  speechSynthesis.speak(u);
  return true;
}
