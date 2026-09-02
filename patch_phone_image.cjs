const fs = require('fs');

// 1. Patch CustomerForm.tsx
let customerForm = fs.readFileSync('src/components/CustomerForm.tsx', 'utf8');
const oldPhoneValidation = `    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'กรุณาระบุเบอร์โทรศัพท์';
    } else if (customerInfo.phone.replace(/[^0-9]/g, '').length < 9) {
      newErrors.phone = 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 9-10 หลัก';
    }`;
const newPhoneValidation = `    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'กรุณาระบุเบอร์โทรศัพท์';
    } else if (!/^[0-9\\-\\s]+$/.test(customerInfo.phone)) {
      newErrors.phone = 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น (ห้ามมีตัวอักษร)';
    } else if (customerInfo.phone.replace(/[^0-9]/g, '').length < 9 || customerInfo.phone.replace(/[^0-9]/g, '').length > 10) {
      newErrors.phone = 'เบอร์โทรศัพท์ต้องมี 9-10 หลัก';
    }`;
if(customerForm.includes("length < 9")) {
  customerForm = customerForm.replace(oldPhoneValidation, newPhoneValidation);
  fs.writeFileSync('src/components/CustomerForm.tsx', customerForm);
  console.log("CustomerForm phone validation patched.");
}

// 2. Patch PaymentModal.tsx
let paymentModal = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');
if (!paymentModal.includes('imageCompression')) {
  paymentModal = paymentModal.replace(
    "import { toast } from 'react-hot-toast';",
    "import { toast } from 'react-hot-toast';\nimport imageCompression from 'browser-image-compression';"
  );
  
  const oldHandleFileStart = `  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 5MB');
        return;
      }`;
      
  const newHandleFileStart = `  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let fileToProcess = file;
      
      // Auto compress if image is large (e.g. > 1MB)
      if (file.size > 1024 * 1024) {
        toast.loading('กำลังปรับขนาดรูปภาพอัตโนมัติ...', { id: 'compressing' });
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          fileToProcess = await imageCompression(file, options);
          toast.success('ปรับขนาดรูปภาพสำเร็จ', { id: 'compressing' });
        } catch (error) {
          console.error('Error compressing image:', error);
          toast.dismiss('compressing');
          toast.error('ไม่สามารถปรับขนาดรูปภาพได้ จะใช้ไฟล์ต้นฉบับ');
        }
      }

      if (fileToProcess.size > 5 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ยังคงใหญ่เกินไป กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 5MB');
        return;
      }
      
      // We will now use fileToProcess instead of file for the rest of the flow`;
      
  paymentModal = paymentModal.replace(oldHandleFileStart, newHandleFileStart);
  
  // Replace `file.name` with `fileToProcess.name`
  paymentModal = paymentModal.replace('setSlipFileName(file.name);', 'setSlipFileName(fileToProcess.name);');
  
  // Replace `reader.readAsDataURL(file);` with `reader.readAsDataURL(fileToProcess);`
  paymentModal = paymentModal.replace('reader.readAsDataURL(file);', 'reader.readAsDataURL(fileToProcess);');

  fs.writeFileSync('src/components/PaymentModal.tsx', paymentModal);
  console.log("PaymentModal image compression patched.");
}

