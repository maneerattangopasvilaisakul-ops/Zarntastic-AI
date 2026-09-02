const fs = require('fs');

let code = fs.readFileSync('src/components/KnowledgeBase.tsx', 'utf8');
code = code.replace(
  "      />\n    </div>\n  );\n}",
  "      />\n    </div>\n    </>\n  );\n}"
);

fs.writeFileSync('src/components/KnowledgeBase.tsx', code);
console.log("Fixed KB");
