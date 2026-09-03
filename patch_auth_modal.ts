import fs from 'fs';

let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf-8');

const importReplacement = `import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, MessageCircle, X, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle } from '../firebase';
`;

content = content.replace(
  `import { useState, useEffect } from 'react';\nimport { createPortal } from 'react-dom';\nimport { Mail, Lock, Eye, EyeOff, User, Phone, MessageCircle, X, ArrowRight, Loader2 } from 'lucide-react';\nimport { useAuth } from '../contexts/AuthContext';`,
  importReplacement
);

const googleButton = `
            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={async () => {
                setError('');
                setIsLoading(true);
                try {
                  await signInWithGoogle();
                  onClose();
                } catch (err: any) {
                  setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full py-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mb-4"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>ดำเนินการต่อด้วย Google</span>
            </button>
            <div className="relative mb-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <span className="relative bg-white px-2 text-xs text-stone-500">หรือใช้อีเมล</span>
            </div>
`;

if (!content.includes('signInWithGoogle')) {
  // It might not have matched exactly, let's just do a simpler replace.
  const formStart = `<form onSubmit={handleSubmit} className="space-y-4">`;
  content = content.replace(formStart, formStart + googleButton);
  
  if (!content.includes('import { signInWithGoogle } from')) {
    content = `import { signInWithGoogle } from '../firebase';\n` + content;
  }
}

fs.writeFileSync('src/components/AuthModal.tsx', content);
console.log('AuthModal patched');
