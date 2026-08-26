import fs from 'fs';

let content = fs.readFileSync('src/components/SlotScheduler.tsx', 'utf-8');

const replacement = `
  const isScheduleComplete = selectedSlots.length >= course.totalDays && 
    Array.from({ length: course.totalDays }, (_, i) => i + 1).every((dNum) => 
      selectedSlots.some((s) => s.dayNumber === dNum)
    );

  if (course.durationCategory === 'vdo') {
    return (
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>ขั้นตอนที่ 2: เตรียมพร้อมเรียนคอร์ส VDO</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{course.title}</span>
            </h2>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-indigo-900">คอร์สเรียนนี้เป็นรูปแบบ VDO Online</h3>
          <p className="text-indigo-700/80 max-w-md mx-auto">
            เรียนได้ทุกวันทุกเวลา หลังชำระเงินเรียบร้อยแล้ว Admin จะทำการตรวจสอบและลูกค้าจะได้สิทธิ์เข้าสู่ link VDO เพื่อเริ่มเรียนได้ทันที
          </p>
          
          <button
            onClick={() => {
              // Create a mock slot for VDO to pass validation
              onSelectSlots([{
                date: new Date().toISOString().slice(0, 10),
                startTime: '00:00',
                endTime: '23:59',
                dayNumber: 1
              }]);
              onProceedToForm();
            }}
            className="mt-6 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto"
          >
            ไปที่ขั้นตอนถัดไป (กรอกข้อมูล) <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
`;

content = content.replace(
  /const isScheduleComplete = [\s\S]*?return \(/, 
  replacement
);

fs.writeFileSync('src/components/SlotScheduler.tsx', content);
