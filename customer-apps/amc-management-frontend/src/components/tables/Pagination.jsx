// src/components/tables/Pagination.jsx
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${className}`}>
      <p className="text-xs sm:text-sm text-text-secondary">
        Showing <span className="font-medium text-navy">{start}–{end}</span> of{' '}
        <span className="font-medium text-navy">{totalItems}</span> records
      </p>
      <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-text-secondary"
          title="First Page"
        >
          <ChevronsLeft size={15} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-text-secondary"
          title="Previous Page"
        >
          <ChevronLeft size={15} />
        </button>
        {getPageNumbers().map((page, i) => (
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-text-muted text-xs sm:text-sm">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={[
                'w-7 h-7 sm:w-8 sm:h-8 rounded text-xs sm:text-sm font-medium transition-colors shrink-0',
                page === currentPage
                  ? 'bg-solar text-white'
                  : 'text-text-secondary hover:bg-gray-100 hover:text-navy',
              ].join(' ')}
            >
              {page}
            </button>
          )
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-text-secondary"
          title="Next Page"
        >
          <ChevronRight size={15} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-text-secondary"
          title="Last Page"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
}
