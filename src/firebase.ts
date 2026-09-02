import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "ai-course-booking",
  appId: "1:109147327047:web:7b5bd7f5ed8cd954ecbf62",
  apiKey: "AIzaSyAlcNoNRng4cZG6gfLMpVFEJ4XS5dMcz5k",
  authDomain: "ai-course-booking.firebaseapp.com",
  storageBucket: "ai-course-booking.firebasestorage.app",
  messagingSenderId: "109147327047"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
