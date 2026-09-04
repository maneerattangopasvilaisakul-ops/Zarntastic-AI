import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  schema?: any;
}

export function SEO({ 
  title = 'Zarntastic AI Course - คอร์สเรียน AI และ Prompt Engineering โดย อ.มณีรัตน์', 
  description = 'คอร์สเรียน AI, Prompt Engineering, ลดเวลาทำงาน, เพิ่มประสิทธิภาพด้วย Gemini, ChatGPT, Claude. สอนโดย อ.มณีรัตน์ ตั้งโอภาสวิไลสกุล ( Coach ซาน) (Zarntastic AI Learning)',
  keywords = 'AI Course, Prompt Engineering, สอน AI, คอร์สเรียน AI, มณีรัตน์ ตั้งโอภาสวิไลสกุล, Fastwork AI, Gemini, ChatGPT',
  image = 'https://firebasestorage.googleapis.com/v0/b/ai-course-booking.firebasestorage.app/o/og-image.jpg?alt=media', // Placeholder
  url = 'https://zarntastic-ai-course.web.app',
  schema 
}: SEOProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* JSON-LD Schema */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
