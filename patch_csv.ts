import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const sanitizeFn = `
  const sanitizeCSV = (val: string) => {
    if (val && /^[=+\-@]/.test(val)) {
      return "'" + val;
    }
    return val;
  };
`;

const exportCSVRe = /const handleExportCSV = \(\) => \{/m;
content = content.replace(exportCSVRe, `const handleExportCSV = () => {${sanitizeFn}`);

content = content.replace(/`"\$\{b\.customer\.name\}"`/g, '`"${sanitizeCSV(b.customer.name)}"`');
content = content.replace(/`"\$\{b\.customer\.phone\}"`/g, '`"${sanitizeCSV(b.customer.phone)}"`');
content = content.replace(/`"\$\{b\.customer\.email\}"`/g, '`"${sanitizeCSV(b.customer.email)}"`');
content = content.replace(/`"\$\{b\.customer\.lineId\}"`/g, '`"${sanitizeCSV(b.customer.lineId || "")}"`');

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
