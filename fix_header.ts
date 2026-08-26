import fs from 'fs';

let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');
const searchBlock = `                </button>
              )}
            </div>
</div>
        </div>
      </div>
      {showAuthModal`;

const replaceBlock = `                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {showAuthModal`;

content = content.replace(searchBlock, replaceBlock);
fs.writeFileSync('src/components/Header.tsx', content);
