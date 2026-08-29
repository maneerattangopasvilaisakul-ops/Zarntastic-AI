import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
initializeApp({ projectId: config.projectId });

(async () => {
  try {
    const userRecord = await getAuth().createUser({
      email: 'admin@zarntastic.com',
      password: 'admin123',
      displayName: 'อาจารย์ซาร์น',
    });
    console.log('Successfully created new user:', userRecord.uid);
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.log('Admin user already exists');
    } else {
      console.error('Error creating new user:', error);
    }
  }
})();
