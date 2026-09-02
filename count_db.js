import { initializeApp } from "firebase/app";
import { getFirestore, collection, getCountFromServer } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function countDb() {
  const coll = collection(db, 'bookings');
  const snapshot = await getCountFromServer(coll);
  console.log(`Remaining bookings: ${snapshot.data().count}`);
  process.exit(0);
}
countDb();
