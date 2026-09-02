const fs = require('fs');

let code = fs.readFileSync('src/components/KnowledgeBase.tsx', 'utf8');

const lastDivIdx = code.lastIndexOf("    </div>");
if (lastDivIdx !== -1) {
  const before = code.substring(0, lastDivIdx);
  const after = code.substring(lastDivIdx);
  // after is: "    </div>\n  );\n}"
  const replaced = after.replace("    </div>\n  );\n}", "    </div>\n    </>\n  );\n}");
  fs.writeFileSync('src/components/KnowledgeBase.tsx', before + replaced);
  console.log("Fixed by splitting");
} else {
  console.log("last div not found");
}

