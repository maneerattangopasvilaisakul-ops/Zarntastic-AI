import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || "(default)");

async function checkDb() {
  const snapshot = await getDocs(collection(db, 'bookings'));
  console.log(`Current bookings in DB: ${snapshot.size}`);
  process.exit(0);
}
checkDb();
