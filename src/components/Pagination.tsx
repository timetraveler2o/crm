import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (pp: number) => void;
}

const PER_PAGE_OPTIONS = [30, 50, 100];

export default function Pagination({ totalItems, currentPage, perPage, onPageChange, onPerPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  // Generate page numbers with ellipsis
  const getPages = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (currentPage > 3) pages.push('ellipsis');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-gray-50/50 border-t border-gray-100">
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>Showing {startItem}–{endItem} of {totalItems}</span>
        <div className="flex items-center gap-1.5">
          <span className="font-medium">Per page:</span>
          <select
            value={perPage}
            onChange={(e) => { onPerPageChange(Number(e.target.value)); onPageChange(1); }}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            {PER_PAGE_OPTIONS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {getPages().map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e${i}`} className="px-2 text-gray-400 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[28px] h-7 rounded-lg text-xs font-semibold transition-colors ${
                currentPage === p
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
