// PromptPay QR Code generator & Bank details helper

export interface PromptPayDetails {
  accountName: string;
  accountNameEn: string;
  phoneNumber: string;
  promptPayId: string;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  contactLine: string;
  contactEmail: string;
  contactPhone: string;
}

export const ACADEMY_PAYMENT_INFO: PromptPayDetails = {
  accountName: 'มณีรัตน์ ตั้งโอภาสวิไลสกุล',
  accountNameEn: 'Maneerat Tangopasvilaisakul',
  phoneNumber: '061-561-4269',
  promptPayId: '0615614269',
  bankName: 'ธนาคารกสิกรไทย (KBANK)',
  bankBranch: 'สาขาโลตัส ศรีนครินทร์',
  accountNumber: '585-2-29915-2',
  contactLine: 'https://lin.ee/Sy3xOAP',
  contactEmail: 'zarnzarn10@gmail.com',
  contactPhone: '061-5614269',
};

