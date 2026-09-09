const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/https:\/\/ais-pre-bs4eeo3qrendw7bstnmdwp-887964686274.asia-southeast1.run.app\//g, 'https://zarntastic-ai-learning.com/');

code = code.replace('<meta name="robots" content="index, follow" />', 
  '<meta name="robots" content="index, follow" id="robots-meta" />\n    <script>\n      if (window.location.hostname.includes("run.app") || window.location.hostname.includes("localhost")) {\n        document.getElementById("robots-meta").setAttribute("content", "noindex, nofollow");\n      }\n    </script>');

fs.writeFileSync('index.html', code);
