const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contentsPayload,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });`;

const replacementStr = `
    const config: any = {
      systemInstruction,
      temperature: 0.7,
    };
    
    // Add Google Search grounding if model is gemini-3.5-flash
    if (selectedModel === "gemini-3.5-flash") {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contentsPayload,
      config,
    });`;

if (content.includes('temperature: 0.7,')) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.ts', content);
  console.log("Gemini tools patched.");
} else {
  console.log("Could not find target string.");
}

