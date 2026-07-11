// Client-side Firebase config, for the future sign-in phase (see ARCHITECTURE.md
// Section 10). Copy this to firebase-config.js and fill in real values once the
// Firebase project exists — firebase-config.js is gitignored and never committed.
//
// Until sign-in ships, the client checks whether these are still placeholders
// and keeps all sync UI hidden if so (TW-203) — the app works fully offline
// via localStorage with no Firebase config at all.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export default firebaseConfig;
