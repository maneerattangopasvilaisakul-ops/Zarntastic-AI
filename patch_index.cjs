const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('favicon.svg')) {
    html = html.replace('<head>', '<head>\n    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
    fs.writeFileSync('index.html', html);
}
console.log('patched index.html');
