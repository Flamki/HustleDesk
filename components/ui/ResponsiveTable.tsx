
import React from 'react';

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    label: string;
    render: (item: T) => React.ReactNode;
    mobileLabel?: string;
    hideOnMobile?: boolean;
  }>;
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T) => void;
  mobileCard?: (item: T) => React.ReactNode;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyState,
  onRowClick,
  mobileCard,
}: ResponsiveTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <div>{emptyState}</div>;
  }

  return (
    <>
      {/* Mobile Card View */}
      {mobileCard && (
        <div className="block md:hidden space-y-3">
          {data.map((item) => (
            <div
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {mobileCard(item)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop Table View */}
      <div className={`${mobileCard ? 'hidden md:block' : 'block'} overflow-x-auto -mx-4 sm:mx-0`}>
        <table className="w-full text-left text-sm min-w-[640px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns
                  .filter((col) => !col.hideOnMobile)
                  .map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render(item)}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
