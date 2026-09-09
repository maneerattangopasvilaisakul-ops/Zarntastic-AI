const fs = require('fs');
const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
for(let i=1095; i<=1275; i++) {
    let line = lines[i];
    let os = (line.match(/<div[ \n>]/g) || []).length;
    let cs = (line.match(/<\/div>/g) || []).length;
    balance += os - cs;
    if (os !== cs) console.log(`L${i+1}: +${os} -${cs} = ${balance}`);
}
