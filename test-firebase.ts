import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

try {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId);
  getDocs(collection(db, "bookings")).then(() => {
    console.log("Firebase Client initialized and read successfully.");
    process.exit(0);
  }).catch(e => {
    console.error("Read failed:", e);
    process.exit(1);
  });
} catch (error) {
  console.error("Firebase Client initialization failed:", error);
  process.exit(1);
}
