const fs = require('fs');
const logoCode = `import React from 'react';

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* User provided Logo */}
      <img src="/logo.png" alt="Zarntastic AI Learning" className="h-12 w-auto object-contain" />
    </div>
  );
}
`;
fs.writeFileSync('src/components/Logo.tsx', logoCode);
console.log("Replaced Logo.tsx with img tag");
