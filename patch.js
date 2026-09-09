const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  /const scrubbedBooking = \{\n\s*\.\.\.booking,\n\s*customer: \{ \.\.\.booking\.customer, name: "\*\*\*", phone: "\*\*\*", lineId: "\*\*\*", email: "\*\*\*" \},\n\s*meetingLink: "\*\*\*",\n\s*payment: \{\n\s*\.\.\.booking\.payment,\n\s*slipUrl: undefined\n\s*\}\n\s*\};/g,
  `const scrubbedBooking = {
      ...booking,
      customer: { ...booking.customer, name: "***", phone: "***", lineId: "***", email: "***" },
      meetingLink: "***",
      payment: {
        method: booking.payment?.method,
        amount: booking.payment?.amount,
        status: booking.payment?.status,
        expiresAt: booking.payment?.expiresAt
      }
    };`
);
fs.writeFileSync('server.ts', code);
