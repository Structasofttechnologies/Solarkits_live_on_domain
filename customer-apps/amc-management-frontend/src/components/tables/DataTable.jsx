// src/components/tables/DataTable.jsx
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import EmptyState from '../feedback/EmptyState';
import { SkeletonTable } from '../feedback/SkeletonLoader';

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyState,
  onRowClick,
  rowKey = 'id',
  stickyHeader = true,
  compact = false,
  className = '',
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (col) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  };

  const sortedData = [...(data || [])].sort((a, b) => {
    if (!sortKey) return 0;
    const col = columns.find(c => c.key === sortKey);
    const aVal = col?.accessor ? col.accessor(a) : a[sortKey];
    const bVal = col?.accessor ? col.accessor(b) : b[sortKey];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (loading) return <SkeletonTable rows={6} cols={columns.length} />;

  if (!data?.length) {
    return emptyState ? (
      <div className="border border-border rounded-lg">
        {emptyState}
      </div>
    ) : (
      <div className="border border-border rounded-lg">
        <EmptyState title="No records found" description="There are no items to display." />
      </div>
    );
  }

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3.5';

  return (
    <div className={`overflow-x-auto rounded-lg border border-border ${className}`}>
      <table className="w-full text-sm">
        <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
          <tr className="bg-gray-50 border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  'text-left text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap select-none',
                  cellPadding,
                  col.sortable ? 'cursor-pointer hover:text-navy hover:bg-gray-100 transition-colors' : '',
                  col.align === 'right' ? 'text-right' : '',
                  col.align === 'center' ? 'text-center' : '',
                  col.width ? `w-${col.width}` : '',
                  col.minWidth ? `min-w-${col.minWidth}` : '',
                  col.className || '',
                ].join(' ')}
                onClick={() => handleSort(col)}
                style={{ width: col.fixedWidth }}
              >
                <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''} ${col.align === 'center' ? 'justify-center' : ''}`}>
                  {col.title}
                  {col.sortable && (
                    <span className="text-text-muted">
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      ) : (
                        <ChevronsUpDown size={13} className="opacity-40" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={[
                'border-b border-border last:border-0 transition-colors duration-100',
                onRowClick ? 'hover:bg-blue-50/30 cursor-pointer' : 'hover:bg-gray-50/60',
              ].join(' ')}
            >
              {columns.map((col) => {
                const value = col.accessor ? col.accessor(row) : row[col.key];
                return (
                  <td
                    key={col.key}
                    className={[
                      cellPadding,
                      'text-sm text-text-primary',
                      col.align === 'right' ? 'text-right' : '',
                      col.align === 'center' ? 'text-center' : '',
                      col.className || '',
                    ].join(' ')}
                    style={{ width: col.fixedWidth }}
                  >
                    {col.render ? col.render(value, row) : (value ?? '—')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
