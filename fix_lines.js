const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Fix single line divs
content = content.replace(/(<div[^>]*>.*?)([\r\n]+)/g, (match, p1, p2) => {
    // If it has opening div but no closing div and it's a simple text line
    if (p1.includes('<div') && !p1.includes('</div') && !p1.includes('>') === false) {
        // Only if it looks like a simple line with text
        if (p1.includes('<strong>') || p1.includes('text-xs font-semibold text-') || p1.includes('text-2xl sm:text-3xl')) {
            return p1 + '</div>' + p2;
        }
    }
    return match;
});

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
