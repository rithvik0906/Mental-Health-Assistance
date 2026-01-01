import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error("❌ FIREBASE_PROJECT_ID missing in .env");
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error("❌ FIREBASE_CLIENT_EMAIL missing in .env");
}

if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error("❌ FIREBASE_PRIVATE_KEY missing in .env");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  console.log("✅ Firebase Admin initialized");
}

export const auth = admin.auth();
export const db = admin.firestore();
