import { useState, useMemo } from 'react';
import { FiSearch, FiChevronUp, FiChevronDown } from 'react-icons/fi';

export default function DataTable({ columns, data = [], onRowClick, searchable = true }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filteredData = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]) : '';
        return String(val || '').toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sortedData = useMemo(() => {
    if (!sortCol) return filteredData;
    const col = columns.find((c) => c.key === sortCol || c.accessor === sortCol);
    if (!col) return filteredData;
    return [...filteredData].sort((a, b) => {
      const accessor = typeof col.accessor === 'function' ? col.accessor : (row) => row[col.accessor];
      const aVal = accessor(a) || '';
      const bVal = accessor(b) || '';
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortCol, sortDir, columns]);

  const handleSort = (colKey) => {
    if (sortCol === colKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-primary-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key || col.accessor}
                  className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider cursor-pointer select-none hover:bg-primary-100 transition-colors"
                  onClick={() => handleSort(col.key || col.accessor)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {sortCol === (col.key || col.accessor) && (
                      sortDir === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={row._id || row.id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                >
                  {columns.map((col) => (
                    <td key={col.key || col.accessor} className="px-4 py-3 text-sm text-gray-700">
                      {col.render
                        ? col.render(row)
                        : typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">
        Showing {sortedData.length} of {data.length} entries
      </p>
    </div>
  );
}
