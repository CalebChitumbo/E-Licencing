import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(config);
export const auth = getAuth(firebaseApp);

if (import.meta.env.VITE_USE_AUTH_EMULATOR === "1") {
  const url = import.meta.env.VITE_AUTH_EMULATOR_URL || "http://localhost:9099";
  connectAuthEmulator(auth, url, { disableWarnings: true });
}
