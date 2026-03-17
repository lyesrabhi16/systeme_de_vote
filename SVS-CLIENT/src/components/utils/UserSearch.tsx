import * as React from 'react';
import { ChevronsUpDown } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import type { UserResponseModel } from '@/api/sdk';
import UserAvatarWithUserName from '@/components/utils/UserAvatarWithUserName';
import { Spinner } from '@/components/ui/spinner';

export function UserSearch(props: {
  users: UserResponseModel[];
  loading?: boolean;
  onSearchChange?: (v: string) => void;
  onSelectUser?: (user: UserResponseModel) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [users, setUsers] = React.useState<UserResponseModel[]>(props.users);
  React.useEffect(() => {
    setUsers(props.users);
  }, [props.users]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-controls='user-search'
          aria-expanded={open}
          className='w-[300px] justify-between'
        >
          Search user...
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-[300px] p-0'>
        <Command>
          <CommandInput
            placeholder='Search users...'
            onValueChange={(v) => props.onSearchChange?.(v)}
          />
          <CommandEmpty>No user found.</CommandEmpty>
          <CommandGroup>
            {props.loading ? (
              <div className='p-4 text-center text-sm text-gray-500'>
                <Spinner className='mx-auto' />
              </div>
            ) : (
              users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.email}
                  onSelect={() => {
                    setUsers((users) => users.filter((u) => u.id !== user.id));
                    props.onSelectUser?.(user);
                  }}
                >
                  <div className='flex items-center gap-3'>
                    <UserAvatarWithUserName user={user} />

                    <div className='flex flex-col'>
                      <span className='text-sm'>{user.username}</span>
                      <span className='text-xs text-muted-foreground'>
                        {user.email}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
