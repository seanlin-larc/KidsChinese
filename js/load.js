// Loads the Firebase code (./firebase/auth.js) with a time limit and finds out who is
// signed in. This file has no Firebase code.

const AUTH_URL = new URL('./firebase/auth.js', import.meta.url).href;

export function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, no) =>
    setTimeout(() => no(Object.assign(new Error('timeout'), { code: 'app/timeout' })), ms))]);
}

let authPromise = null;
let loadError = null;

// Resolves to the firebase/auth.js module, or null when it cannot load.
// lastLoadError() then tells why: "app/not-configured" or a network error.
export function loadAuth() {
  if (!authPromise) {
    authPromise = withTimeout(import(AUTH_URL), 12000).catch((e) => {
      console.warn('[kidschinese] Firebase did not load:', e);
      loadError = e;
      authPromise = null;            // try again next time
      return null;
    });
  }
  return authPromise;
}

export function lastLoadError() {
  return loadError;
}

// Finds out who is signed in. Returns { mode, auth, player, error }:
//   mode "online"         a family account is signed in (Firebase restored the sign-in;
//                          this also works without internet after the first sign-in)
//   mode "signed-out"     nobody is signed in
//   mode "not-allowed"    a Kids Games account that cannot use KidsChinese (Guest) is signed in;
//                          error.who has its name. It is not signed out automatically, because
//                          the sign-in is shared with the Kids Games site.
//   mode "not-configured" config.js has no Firebase project yet
//   mode "offline"        Firebase did not load or did not answer
export async function access() {
  const auth = await loadAuth();
  if (!auth) {
    const err = lastLoadError();
    return { mode: err && err.code === 'app/not-configured' ? 'not-configured' : 'offline', auth: null, error: err };
  }
  try {
    const player = await withTimeout(auth.currentPlayer(), 7000);
    if (!player) return { mode: 'signed-out', auth };
    return { mode: 'online', auth, player };
  } catch (e) {
    if (e && e.message === 'not-family') return { mode: 'not-allowed', auth, error: e };
    return { mode: 'offline', auth, error: e };
  }
}
