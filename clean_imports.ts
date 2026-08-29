import fs from 'fs';
let content = fs.readFileSync('src/components/AdminLoginForm.tsx', 'utf8');
content = content.replace("import { signInWithEmailAndPassword } from 'firebase/auth';", "");
content = content.replace("import { auth } from '../firebase';", "");
fs.writeFileSync('src/components/AdminLoginForm.tsx', content);
