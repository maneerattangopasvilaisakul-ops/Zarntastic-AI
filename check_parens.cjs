const fs = require('fs');
let lines = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8').split('\n');

let openBraces = 0;
let openParens = 0;
for(let i=1095; i<=1273; i++) {
    let line = lines[i];
    
    // very naive, won't handle strings correctly, but might give a hint
    let ob = (line.match(/\{/g) || []).length;
    let cb = (line.match(/\}/g) || []).length;
    openBraces += ob - cb;

    let op = (line.match(/\(/g) || []).length;
    let cp = (line.match(/\)/g) || []).length;
    openParens += op - cp;
}
console.log("Braces:", openBraces, "Parens:", openParens);
