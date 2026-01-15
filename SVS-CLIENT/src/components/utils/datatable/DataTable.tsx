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
import { useEffect, useState } from 'react';
import { DataTablePagination } from '@/components/utils/datatable/Pagination';
import type { PaginatedListResponse } from '@/api/client';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  fetchData: (page: number, elementsParPage: number, search?: string) => void;
  metadata?: PaginatedListResponse;
  initialPageSize?: number;
  initialSortingState?: SortingState;
  onRowDoubleClick?: (row: TData) => void;
  search?: string;
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
    state: { sorting: sorting, pagination },
    manualPagination: true,
    rowCount: metadata?.total_count ?? 0,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // 🔹 Cycle de chargement des données prévisible
  useEffect(() => {
    fetchData(pagination.pageIndex + 1, pagination.pageSize, search);
  }, [pagination.pageIndex, pagination.pageSize, search]);

  return (
    <div className='rounded-xl border bg-background shadow-sm'>
      <div className='relative overflow-x-auto'>
        <Table className='min-w-full'>
          {/* En-tête */}
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

          {/* Corps */}
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className='group transition-colors hover:bg-muted/30'
                  onDoubleClick={() =>
                    onRowDoubleClick && onRowDoubleClick(row.original)
                  }
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

      {/* Pagination */}
      <div className='border-t bg-muted/20 px-4 py-3'>
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
