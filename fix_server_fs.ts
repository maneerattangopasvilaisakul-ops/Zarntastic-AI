import fs from 'fs';
let content = fs.readFileSync('server_patched.ts', 'utf8');
content = content.replace('import { GoogleGenAI, Type } from "@google/genai";', 'import { GoogleGenAI, Type } from "@google/genai";\nimport fs from "fs";');
fs.writeFileSync('server.ts', content);
