const fs = require('fs');

let code = fs.readFileSync('src/components/KnowledgeBase.tsx', 'utf8');

const target = "      />\n    </div>\n  );\n}";
const replacement = "      />\n    </div>\n    </>\n  );\n}";

code = code.replace(
  "      <ArticleModal\n        article={selectedArticle}\n        onClose={() => setSelectedArticle(null)}\n        onSelectCourseById={onSelectCourseById}\n      />\n    </div>\n  );\n}",
  "      <ArticleModal\n        article={selectedArticle}\n        onClose={() => setSelectedArticle(null)}\n        onSelectCourseById={onSelectCourseById}\n      />\n    </div>\n    </>\n  );\n}"
);

fs.writeFileSync('src/components/KnowledgeBase.tsx', code);
console.log("Fixed KB 3");
