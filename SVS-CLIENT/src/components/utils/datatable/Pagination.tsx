import { type Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [5, 10, 20, 25, 50, 100],
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalCount = table.getFilteredRowModel().rows.length;

  return (
    <div className='flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between'>
      {/* Selection count — only shown when row selection is enabled */}
      {selectedCount > 0 ? (
        <p className='flex-1 text-sm text-muted-foreground'>
          {selectedCount} sur {totalCount} ligne(s) sélectionnée(s)
        </p>
      ) : (
        <p className='flex-1 text-sm text-muted-foreground'>
          {totalCount} ligne(s)
        </p>
      )}

      <div className='flex flex-wrap items-center gap-4 lg:gap-6'>
        {/* Page size selector */}
        <div className='flex items-center gap-2'>
          <p className='text-sm font-medium whitespace-nowrap'>
            Lignes par page
          </p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
              table.setPageIndex(0);
            }}
          >
            <SelectTrigger className='h-8 w-20'>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page indicator */}
        <div className='flex min-w-[100px] items-center justify-center text-sm font-medium tabular-nums'>
          Page {pageIndex + 1} sur {pageCount > 0 ? pageCount : 1}
        </div>

        {/* Navigation buttons */}
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon'
            className='hidden h-8 w-8 lg:flex'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label='Première page'
          >
            <ChevronsLeft className='h-4 w-4' />
          </Button>

          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label='Page précédente'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label='Page suivante'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>

          <Button
            variant='outline'
            size='icon'
            className='hidden h-8 w-8 lg:flex'
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label='Dernière page'
          >
            <ChevronsRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
