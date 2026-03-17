import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DataTablePagination } from '@/components/utils/datatable/Pagination';
import type { PaginatedListResponse } from '@/api/client';
import { Skeleton } from '@/components/ui/skeleton';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  fetchData: (page: number, elementsParPage: number, search?: string) => void;
  metadata?: PaginatedListResponse;
  initialPageSize?: number;
  initialSortingState?: SortingState;
  onRowDoubleClick?: (row: TData) => void;
  search?: string;
  loading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  metadata,
  fetchData,
  initialSortingState,
  initialPageSize = 10,
  onRowDoubleClick,
  search,
  loading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(
    initialSortingState ?? [],
  );
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    manualPagination: true,
    rowCount: metadata?.total_count ?? 0,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Reset to page 0 when search changes, but not on first render
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search]);

  // Stable wrapper so fetchData reference changes don't retrigger the effect
  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  });

  useEffect(() => {
    fetchDataRef.current(pagination.pageIndex + 1, pagination.pageSize, search);
  }, [pagination.pageIndex, pagination.pageSize, search]);

  const skeletonRows = Array.from({ length: pagination.pageSize });

  return (
    <div className='rounded-xl border bg-background shadow-sm'>
      <div className='relative overflow-x-auto'>
        <Table className='min-w-full'>
          <TableHeader className='bg-muted/40'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className='px-4 py-3 text-left text-sm font-semibold text-muted-foreground'
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              // Skeleton rows while fetching
              skeletonRows.map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={`skeleton-cell-${j}`} className='px-4 py-4'>
                      <Skeleton className='h-4 w-full rounded' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className='group transition-colors hover:bg-muted/30 cursor-pointer'
                  onDoubleClick={() => onRowDoubleClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className='px-4 py-4 text-sm'>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='py-24 text-center'
                >
                  <div className='flex flex-col items-center gap-2'>
                    <p className='text-base font-medium'>
                      Aucun résultat trouvé
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Essayez de modifier vos filtres ou votre recherche
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='border-t bg-muted/20 px-4 py-3'>
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
