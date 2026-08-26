export type DurationCategory = '1-day-1h' | '1-day-3h' | '2-day-6h' | '2-day-8h' | '4-day-12h' | string;

export type CourseCategoryGroup = 
  | 'all' 
  | 'starter' 
  | 'productivity' 
  | 'marketing' 
  | 'web' 
  | 'claude' 
  | 'coaching';

export type UserCategory = 'general' | 'corporate';

export type BookingStatus = 
  | 'pending_slip' 
  | 'under_review' 
  | 'confirmed' 
  | 'rejected' 
  | 'completed' 
  | 'cancelled';

export interface FastworkReview {
  id: string;
  author: string;
  avatar?: string;
  role: string;
  company?: string;
  rating: number; // 5.0
  comment: string;
  courseTitle: string;
  date: string;
  verified: boolean;
}

export interface Course {
  id: string;
  title: string;
  titleEn: string;
  tagline: string;
  description: string;
  durationCategory: DurationCategory;
  categoryGroup?: CourseCategoryGroup;
  totalHours?: number;
  totalDays?: number;
  hoursPerDay?: number;
  price: number;
  originalPrice: number;
  level?: 'เริ่มต้น (Beginner)' | 'ปานกลาง (Intermediate)' | 'ขั้นสูง (Advanced)' | 'ปานกลาง - ขั้นสูง (Intermediate - Advanced)';
  instructor?: {
    name: string;
    role: string;
    avatar: string;
    bio: string;
    fastworkBadge?: string;
  };
  topics?: string[];
  prerequisites?: string[];
  whoIsThisFor?: string[];
  bonusGifts?: string[];
  scheduleRuleNotice?: string;
  badgeColor?: string;
  iconName?: string;
  featured?: boolean;
  fastworkUrl?: string;
  fastworkRating?: number;
  fastworkReviewCount?: number;
  coverImage?: string;
  keyFeatures?: string[];
  targetAudience?: string | string[];
  recommended?: boolean;
  isActive?: boolean;
}

export interface ScheduleSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  dayNumber: number; // 1 or 2
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  lineId: string;
  notes?: string;
  experienceLevel?: string;
  targetGoal?: string;
  clientType?: UserCategory; // 'general' | 'corporate'
  companyName?: string;
  taxId?: string;
}

export interface AIVerification {
  detectedAmount?: number;
  detectedDate?: string;
  detectedRef?: string;
  senderBank?: string;
  receiverName?: string;
  confidence?: number;
  statusMatch?: boolean;
  notes?: string;
}

export interface PaymentInfo {
  method: 'promptpay' | 'bank_transfer';
  amount: number;
  slipUrl?: string;
  slipUploadedAt?: string;
  referenceNo?: string;
  status: BookingStatus;
  reviewedAt?: string;
  reviewNotes?: string;
  aiVerification?: AIVerification;
}

export interface Booking {
  id: string;
  courseId: string;
  courseTitle: string;
  totalHours: number;
  totalDays: number;
  totalPrice: number;
  customer: CustomerInfo;
  schedule: ScheduleSlot[];
  payment: PaymentInfo;
  meetingLink: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'review' | 'system';
  timestamp: string;
  isRead: boolean;
  bookingId?: string;
}

export interface AvailableSlotInfo {
  startTime: string;
  endTime: string;
  isOccupied: boolean;
  bookedBy?: string;
}

export interface DayAvailability {
  date: string;
  isWeekend: boolean;
  operatingHours: string;
  slots: AvailableSlotInfo[];
  message?: string;
}

// User & Auth Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  lineId: string;
  role: 'student' | 'admin';
}

export interface LineNotificationLog {
  id: string;
  bookingId?: string;
  recipientName: string;
  recipientLineId?: string;
  targetLineUserId?: string;
  eventType: 'booking_created' | 'slip_uploaded' | 'payment_confirmed' | 'status_changed' | 'reminder' | 'test';
  message: string;
  status: 'sent' | 'failed' | 'simulated';
  deliveryMode: 'push' | 'broadcast' | 'simulated';
  timestamp: string;
  details?: {
    courseTitle?: string;
    totalPrice?: number;
    scheduleText?: string;
    meetingLink?: string;
    reviewNotes?: string;
    tokenSource?: 'environment' | 'custom' | 'sandbox';
    flexMessageUsed?: boolean;
    botName?: string;
  };
}

export interface LineMessagingApiSettings {
  enabled: boolean;
  tokenConfigured: boolean;
  channelAccessToken?: string;
  channelSecret?: string;
  adminLineUserId?: string;
  defaultDeliveryMode: 'push' | 'broadcast' | 'auto';
  useFlexMessage: boolean;
  notifyOnBookingCreated: boolean;
  notifyOnSlipUploaded: boolean;
  notifyOnPaymentConfirmed: boolean;
  notifyOnStatusChanged: boolean;
  includeMeetingLink: boolean;
  botInfo?: {
    userId?: string;
    basicId?: string;
    displayName?: string;
    pictureUrl?: string;
    chatMode?: string;
  };
}

export interface KnowledgeFaq {
  question: string;
  answer: string;
}

export interface KnowledgePromptExample {
  title: string;
  role: string;
  prompt: string;
  explanation: string;
}

export interface KnowledgeArticle {
  id: number | string;
  slug: string;
  type: 'article' | 'video' | 'guide';
  category: 'prompt' | 'geo_seo' | 'marketing' | 'models' | 'automation' | 'agents' | 'studio';
  categoryLabel: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  desc: string;
  image: string;
  readTime: string;
  publishedAt: string;
  updatedAt: string;
  author: {
    name: string;
    role: string;
    avatar: string;
    verified: boolean;
  };
  tags: string[];
  keyTakeaways: string[];
  contentHtml: string;
  promptExamples?: KnowledgePromptExample[];
  faqs: KnowledgeFaq[];
  relatedCourseId?: string;
  views?: number;
  likes?: number;
}

// Backward compatibility alias if needed
export type LineNotifySettings = LineMessagingApiSettings;
