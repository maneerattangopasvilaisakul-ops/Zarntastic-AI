const fs = require('fs');

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Add currentPage state
code = code.replace(
  "const [seedNotice, setSeedNotice] = useState<string | null>(null);",
  "const [seedNotice, setSeedNotice] = useState<string | null>(null);\n  const [currentPage, setCurrentPage] = useState(1);\n  const ITEMS_PER_PAGE = 20;"
);

// Reset currentPage on filter change
code = code.replace(
  "onChange={(e) => setSearchTerm(e.target.value)}",
  "onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}"
);
code = code.replace(
  "onChange={(e) => setStatusFilter(e.target.value)}",
  "onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}"
);
code = code.replace(
  "onChange={(e) => setDateFilter(e.target.value)}",
  "onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}"
);

// Add paginatedBookings
code = code.replace(
  "  const filteredBookings = useMemo(() => {",
  "  const paginatedBookings = useMemo(() => {\n    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;\n    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);\n  }, [filteredBookings, currentPage]);\n\n  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);\n\n  const filteredBookings = useMemo(() => {"
);

// Use paginatedBookings for rendering
code = code.replace(
  "filteredBookings.map((b) => (",
  "paginatedBookings.map((b) => ("
);

// Add Pagination controls
const paginationControls = `
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-stone-200">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-stone-700">
                        แสดง <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> ถึง <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)}</span> จาก <span className="font-medium">{filteredBookings.length}</span> รายการ
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-stone-300 bg-white text-sm font-medium text-stone-500 hover:bg-stone-50 disabled:bg-stone-100 disabled:text-stone-400"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={\`relative inline-flex items-center px-4 py-2 border text-sm font-medium \${currentPage === i + 1 ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-stone-300 text-stone-500 hover:bg-stone-50'}\`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-stone-300 bg-white text-sm font-medium text-stone-500 hover:bg-stone-50 disabled:bg-stone-100 disabled:text-stone-400"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                  
                  {/* Mobile Pagination */}
                  <div className="flex items-center justify-between sm:hidden w-full">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-stone-300 text-sm font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50 disabled:bg-stone-100"
                    >
                      ก่อนหน้า
                    </button>
                    <span className="text-sm text-stone-700">หน้า {currentPage} จาก {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-4 py-2 border border-stone-300 text-sm font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50 disabled:bg-stone-100"
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              )}
            </div>
`;

code = code.replace(
  "                </tbody>\n              </table>\n            </div>",
  paginationControls
);

// We need to import ChevronLeft and ChevronRight
if (!code.includes("ChevronLeft")) {
  code = code.replace("SearchX,", "SearchX, ChevronLeft, ChevronRight,");
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('patched pagination');
