import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

async function clearDb() {
  try {
    // Attempt default initialization
    initializeApp();
    const db = getFirestore();
    const snapshot = await db.collection('bookings').get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Deleted ${snapshot.size} bookings`);
  } catch (err) {
    console.error(err);
  }
}
clearDb();
