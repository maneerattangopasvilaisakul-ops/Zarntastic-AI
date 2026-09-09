const fs = require('fs');
let lines = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8').split('\n');

for(let i=0; i<lines.length; i++) {
    let line = lines[i];
    if (line.includes('<div') && !line.includes('</div')) {
        if (line.match(/<div[^>]*>.*?<strong>/) || 
            line.match(/<div[^>]*>.*?(คิวทั้งหมด|ยอดเงิน|รอดำเนินการ|ยืนยันคิว|รายการ)/) ||
            line.match(/text-(xs|sm|2xl|3xl).*?>[^<]*$/) && !line.match(/<div[^>]*>$/)
        ) {
            lines[i] = line + '</div>';
        }
    }
}
fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
