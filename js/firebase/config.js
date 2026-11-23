// Web app config of the Kids Games Firebase project (kidsgame-7a262). KidsChinese shares it,
// with the same accounts. This is the same config as kidsgames/shared/family.js.
//
// This is not a secret: it only names the project. The Firestore security rules control
// access. The API key accepts only https://seanlin-larc.github.io/* and http://localhost:8000/*.
//
// The same apiKey and the default app name on the same site (seanlin-larc.github.io) mean that
// Firebase keeps ONE sign-in for Kids Games and KidsChinese on a device.
// If FIREBASE_CONFIG is null, the app shows a "not set up" message.

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAeOHHmomoHuUlMu8vHHv7J_nQgztTmEmQ",
  authDomain: "kidsgame-7a262.firebaseapp.com",
  projectId: "kidsgame-7a262",
  storageBucket: "kidsgame-7a262.firebasestorage.app",
  messagingSenderId: "594803942218",
  appId: "1:594803942218:web:e141e745d88090f79997b3"
};

// Firebase web SDK version. Keep it the same as Kids Games, which shares the sign-in.
export const SDK = 'https://www.gstatic.com/firebasejs/13.0.0';
