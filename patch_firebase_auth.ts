import fs from 'fs';

let content = fs.readFileSync('src/firebase.ts', 'utf-8');

if (!content.includes('GoogleAuthProvider')) {
  content = content.replace(
    'import { getAuth } from "firebase/auth";',
    'import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";'
  );
  
  content += `\nexport const googleProvider = new GoogleAuthProvider();`;
  content += `\nexport const signInWithGoogle = () => signInWithPopup(auth, googleProvider);`;
  
  fs.writeFileSync('src/firebase.ts', content);
  console.log('Firebase auth patched');
}
