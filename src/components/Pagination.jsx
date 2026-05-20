import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable pagination component
 * @param {Object} props
 * @param {number} props.page - current page (1-indexed)
 * @param {number} props.pages - total pages
 * @param {number} props.total - total records
 * @param {Function} props.onPageChange - (page) => void
 * @param {string} [props.label] - label for the record count (default: "records")
 */
export default function Pagination({ page = 1, pages = 1, total = 0, onPageChange, label = 'records' }) {
  if (pages <= 1 && total <= 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', padding: '12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
      <span>{total} {total === 1 ? label.replace(/s$/, '') : label}</span>
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* First page */}
          <PaginationButton onClick={() => onPageChange(1)} disabled={page <= 1} icon={ChevronsLeft} />
          {/* Previous */}
          <PaginationButton onClick={() => onPageChange(page - 1)} disabled={page <= 1} icon={ChevronLeft} />
          
          {/* Page numbers */}
          <PageNumbers page={page} pages={pages} onPageChange={onPageChange} />

          {/* Next */}
          <PaginationButton onClick={() => onPageChange(page + 1)} disabled={page >= pages} icon={ChevronRight} />
          {/* Last page */}
          <PaginationButton onClick={() => onPageChange(pages)} disabled={page >= pages} icon={ChevronsRight} />
        </div>
      )}
    </div>
  );
}

function PageNumbers({ page, pages, onPageChange }) {
  const getVisiblePages = () => {
    if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
    const result = [];
    if (page <= 3) {
      result.push(1, 2, 3, 4);
      if (pages > 4) result.push('...', pages);
    } else if (page >= pages - 2) {
      result.push(1, '...');
      for (let i = pages - 3; i <= pages; i++) result.push(i);
    } else {
      result.push(1, '...', page - 1, page, page + 1, '...', pages);
    }
    return result;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {getVisiblePages().map((p, idx) => (
        p === '...' ? (
          <span key={`ellipsis-${idx}`} style={{ padding: '0 6px', color: 'var(--text-muted)' }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={{
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '8px',
              border: p === page ? '1px solid var(--accent-blue)' : '1px solid transparent',
              background: p === page ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: p === page ? 'var(--accent-blue)' : 'var(--text-secondary)',
              fontWeight: p === page ? '600' : '400',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {p}
          </button>
        )
      ))}
    </div>
  );
}

function PaginationButton({ onClick, disabled, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '32px', height: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-primary)',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'all 0.15s'
      }}
    >
      <Icon size={14} />
    </button>
  );
}

/**
 * Hook for client-side pagination of an array
 */
export function useClientPagination(items, pageSize = 12) {
  const [page, setPage] = React.useState(1);
  const total = items.length;
  const pages = Math.ceil(total / pageSize) || 1;
  const safePage = Math.min(page, pages);
  const paginatedItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Reset to page 1 when items change significantly
  React.useEffect(() => {
    if (page > pages) setPage(1);
  }, [items.length]);

  return {
    items: paginatedItems,
    page: safePage,
    pages,
    total,
    setPage
  };
}
