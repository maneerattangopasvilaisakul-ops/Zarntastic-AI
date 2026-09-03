const fs = require('fs');
const glob = require('glob');

const oldUrl = 'https://line.me/R/ti/p/@761rqbfc?ts=09011400&oat_content=url';
const newUrl = 'https://line.me/ti/p/N9UPH4OL4L';

const files = [
  'src/components/FastworkReviews.tsx',
  'src/components/AICourseAdvisor.tsx',
  'src/components/BookingSuccessModal.tsx',
  'src/components/AuthModal.tsx',
  'src/components/PaymentModal.tsx',
  'src/components/Header.tsx',
  'src/utils/promptpay.ts',
  'src/data/courses.ts',
  'server.ts'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes(oldUrl)) {
      content = content.split(oldUrl).join(newUrl);
      fs.writeFileSync(file, content);
      console.log('Updated', file);
    }
  }
});
