import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';

const DataTable = ({
  data = [],
  columns = [],
  selectable = false,
  sortable = true,
  pagination = false,
  pageSize = 10,
  className,
  onRowSelect,
  onMultiSelect,
  selectedRows = [],
  loading = false,
  emptyMessage = 'No data available',
  showHeader = true,
  rowActions,
  ...props
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [localSelectedRows, setLocalSelectedRows] = useState(selectedRows);

  // Memoized sorted and filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortable) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
    });
  }, [data, sortConfig, sortable]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = pagination ? Math.ceil(sortedData.length / pageSize) : 1;

  // Sorting handler
  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc'
          ? 'desc'
          : 'asc',
    }));
  };

  // Selection handlers
  const handleRowSelection = (rowData, rowId) => {
    const newSelectedRows = localSelectedRows.includes(rowId)
      ? localSelectedRows.filter((id) => id !== rowId)
      : [...localSelectedRows, rowId];

    setLocalSelectedRows(newSelectedRows);
    onRowSelect?.(rowData, rowId, newSelectedRows);
    onMultiSelect?.(newSelectedRows);
  };

  const handleSelectAll = () => {
    const allRowIds = paginatedData.map(
      (row, index) => row.id || row._id || index
    );
    const isAllSelected = allRowIds.every((id) =>
      localSelectedRows.includes(id)
    );

    const newSelectedRows = isAllSelected
      ? localSelectedRows.filter((id) => !allRowIds.includes(id))
      : [...new Set([...localSelectedRows, ...allRowIds])];

    setLocalSelectedRows(newSelectedRows);
    onMultiSelect?.(newSelectedRows);
  };

  // Render sort icon
  const renderSortIcon = (columnKey) => {
    if (!sortable) return null;

    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className='ml-2 h-4 w-4 text-muted-foreground' />;
    }

    return sortConfig.direction === 'asc' ? (
      <ArrowUp className='ml-2 h-4 w-4' />
    ) : (
      <ArrowDown className='ml-2 h-4 w-4' />
    );
  };

  // Get cell content
  const getCellContent = (row, column) => {
    if (column.render && typeof column.render === 'function') {
      return column.render(row[column.key], row);
    }

    if (column.key.includes('.')) {
      // Handle nested properties
      return column.key.split('.').reduce((obj, key) => obj?.[key], row);
    }

    return row[column.key];
  };

  const isAllCurrentPageSelected = useMemo(() => {
    const currentPageIds = paginatedData.map(
      (row, index) => row.id || row._id || index
    );
    return (
      currentPageIds.length > 0 &&
      currentPageIds.every((id) => localSelectedRows.includes(id))
    );
  }, [paginatedData, localSelectedRows]);

  const isSomeCurrentPageSelected = useMemo(() => {
    const currentPageIds = paginatedData.map(
      (row, index) => row.id || row._id || index
    );
    return currentPageIds.some((id) => localSelectedRows.includes(id));
  }, [paginatedData, localSelectedRows]);

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
        <span className='ml-2 text-sm text-muted-foreground'>Loading...</span>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      <div className='rounded-md border'>
        <Table>
          {showHeader && (
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className='w-12'>
                    <Checkbox
                      checked={isAllCurrentPageSelected}
                      onCheckedChange={handleSelectAll}
                      indeterminate={
                        isSomeCurrentPageSelected && !isAllCurrentPageSelected
                      }
                      aria-label='Select all rows'
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      column.className,
                      sortable &&
                        column.sortable !== false &&
                        'cursor-pointer select-none'
                    )}
                    onClick={() =>
                      sortable &&
                      column.sortable !== false &&
                      handleSort(column.key)
                    }
                    style={{ width: column.width }}
                  >
                    <div className='flex items-center'>
                      {column.title || column.label}
                      {sortable &&
                        column.sortable !== false &&
                        renderSortIcon(column.key)}
                    </div>
                  </TableHead>
                ))}
                {rowActions && <TableHead className='w-20'>Actions</TableHead>}
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)
                  }
                  className='text-center py-8 text-muted-foreground'
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => {
                const rowId = row.id || row._id || index;
                const isSelected = localSelectedRows.includes(rowId);

                return (
                  <TableRow
                    key={rowId}
                    data-state={isSelected ? 'selected' : undefined}
                    className={cn(
                      isSelected && 'bg-muted/50',
                      'cursor-pointer hover:bg-muted/30'
                    )}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleRowSelection(row, rowId)}
                          aria-label={`Select row ${index + 1}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={column.cellClassName}
                      >
                        {getCellContent(row, column)}
                      </TableCell>
                    ))}
                    {rowActions && (
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          {rowActions(row)}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className='flex items-center justify-between px-2 py-4'>
          <div className='text-sm text-muted-foreground'>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
            {sortedData.length} entries
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className='h-4 w-4' />
              Previous
            </Button>
            <div className='flex items-center gap-1'>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first page, last page, current page, and 2 pages around current
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className='text-muted-foreground'>...</span>
                    )}
                    <Button
                      variant={currentPage === page ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                ))}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}

      {/* Selection info */}
      {selectable && localSelectedRows.length > 0 && (
        <div className='mt-2 text-sm text-muted-foreground'>
          {localSelectedRows.length} row(s) selected
        </div>
      )}
    </div>
  );
};

export default DataTable;
