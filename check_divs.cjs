const fs = require('fs');
let lines = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8').split('\n');

let open = 0;
for(let i=1095; i<=1368; i++) {
    let line = lines[i];
    let opens = (line.match(/<div/g) || []).length;
    let closes = (line.match(/<\/div/g) || []).length;
    open += opens - closes;
    if (open < 0) {
        console.log(`DROPS BELOW 0 AT L${i+1}: ${line.trim()}`);
        break;
    }
}
if (open >= 0) console.log("Final open:", open);
