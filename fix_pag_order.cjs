const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// The replacement was:
// const paginatedBookings = ...
// const totalPages = ...
// const filteredBookings = useMemo(() => {
// We need to move paginatedBookings AFTER filteredBookings.

const targetPag = `  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);`;

code = code.replace(targetPag + "\n\n  const filteredBookings = useMemo(() => {", "  const filteredBookings = useMemo(() => {");
code = code.replace("  }, [bookings, searchTerm, statusFilter, dateFilter]);", "  }, [bookings, searchTerm, statusFilter, dateFilter]);\n\n" + targetPag);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
