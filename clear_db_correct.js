import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
// Use the specific databaseId!
const db = getFirestore(app, config.firestoreDatabaseId || "(default)");

async function clearDb() {
  try {
    const snapshot = await getDocs(collection(db, 'bookings'));
    console.log(`Found ${snapshot.size} bookings`);
    let count = 0;
    for (const document of snapshot.docs) {
      await deleteDoc(doc(db, 'bookings', document.id));
      count++;
    }
    console.log(`Done deleting ${count} bookings`);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
clearDb();
