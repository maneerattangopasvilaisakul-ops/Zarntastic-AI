const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/"@type": "Course",/, \`"@type": "Course",
          "offers": {
            "@type": "Offer",
            "category": "Paid",
            "priceCurrency": "THB",
            "price": "599"
          },\`);

fs.writeFileSync('index.html', code);
