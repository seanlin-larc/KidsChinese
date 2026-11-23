// Web app config of the KidsChinese Firebase project.
//
// This is not a secret: it only names the project. The Firestore security rules control
// access. Restrict the API key to these websites (Google Cloud console → APIs & Services →
// Credentials → Browser key → Application restrictions → Websites):
//   https://seanlin-larc.github.io/*
//   http://localhost:8000/*
//
// Until the project exists, FIREBASE_CONFIG is null and the app shows a "not set up" message.
// Steps: firebase/SETUP.md.

export const FIREBASE_CONFIG = null;

// After you create the project, replace the line above with the config from
// Firebase console → Project settings → Your apps → Web app → SDK setup and configuration → Config:
//
// export const FIREBASE_CONFIG = {
//   apiKey: "…",
//   authDomain: "….firebaseapp.com",
//   projectId: "…",
//   storageBucket: "….firebasestorage.app",
//   messagingSenderId: "…",
//   appId: "…"
// };

// Firebase web SDK version, the same as Kids Games and Reads.
export const SDK = 'https://www.gstatic.com/firebasejs/13.0.0';
