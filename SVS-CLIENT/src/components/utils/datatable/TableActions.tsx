import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

type TableActionItem = {
  key: string;
  content: ReactElement | ReactNode;
  hide?: boolean;
} & Omit<React.ComponentProps<typeof DropdownMenuItem>, 'content'>;
type TableActionsProps = {
  items: TableActionItem[];
};

const TableActions = ({ items }: TableActionsProps) => {
  return (
    <div className='flex justify-end'>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button className='flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted'>
            <MoreHorizontal className='h-4 w-4' />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end'>
          {items.map((item) =>
            item.hide ? (
              <></>
            ) : (
              <DropdownMenuItem
                {...{ ...item, content: undefined }}
                key={item.key}
              >
                {item.content}
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TableActions;
