const fs = require('fs');

let successModal = fs.readFileSync('src/components/BookingSuccessModal.tsx', 'utf8');
successModal = successModal.replace('ID: zarn', 'ส่งตรงถึงอาจารย์');
successModal = successModal.replace('LINE ID: zarn', 'LINE ส่วนตัว');
fs.writeFileSync('src/components/BookingSuccessModal.tsx', successModal);

let paymentModal = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');
paymentModal = paymentModal.replace('LINE ID: zarn', 'LINE ส่วนตัว');
fs.writeFileSync('src/components/PaymentModal.tsx', paymentModal);

let header = fs.readFileSync('src/components/Header.tsx', 'utf8');
header = header.replace('LINE ID: zarn', 'LINE ส่วนตัว');
fs.writeFileSync('src/components/Header.tsx', header);

console.log('Patched UI texts');
