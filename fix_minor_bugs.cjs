const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
  '<meta property="og:image" content="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80" />',
  '<meta property="og:image" content="/logo.png" />'
);
fs.writeFileSync('index.html', html);

let slotCode = fs.readFileSync('src/components/SlotScheduler.tsx', 'utf8');
const todayStr = 'const today = new Date().toISOString().split("T")[0];';
if (!slotCode.includes(todayStr)) {
  slotCode = slotCode.replace(
    '  const [isSubmitting, setIsSubmitting] = useState(false);',
    '  const [isSubmitting, setIsSubmitting] = useState(false);\n  const today = new Date().toISOString().split("T")[0];'
  );
  slotCode = slotCode.replace(
    /type="date"/g,
    'type="date" min={today}'
  );
  fs.writeFileSync('src/components/SlotScheduler.tsx', slotCode);
}
console.log("Minor bugs fixed");
