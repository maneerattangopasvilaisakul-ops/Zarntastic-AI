const fs = require('fs');

let code = fs.readFileSync('src/components/KnowledgeBase.tsx', 'utf8');

const target = "      />\n    </div>\n  );\n}";
const replacement = "      />\n    </div>\n    </>\n  );\n}";

code = code.replace(target, replacement);

fs.writeFileSync('src/components/KnowledgeBase.tsx', code);
console.log("Fixed KB again");
