import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import useAuth from '@/hooks/useAuth';
import { getUserInitials, getUserName } from '@/utils/user.utils';
import { LucideLogOut } from 'lucide-react';
import { toast } from 'sonner';

const UserAvatarMenu = () => {
  const { user, logout } = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className='flex items-center gap-2 rounded-full p-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:pr-3'
        aria-label='Menu du compte'
      >
        <Avatar className='size-9'>
          <AvatarFallback className='bg-accent text-sm font-semibold text-accent-foreground'>
            {getUserInitials(user)}
          </AvatarFallback>
        </Avatar>
        <span className='hidden text-sm font-medium sm:inline'>
          {getUserName(user)}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-48'>
        <DropdownMenuLabel className='flex flex-col'>
          <span className='font-semibold'>{getUserName(user)}</span>
          <span className='text-xs font-normal text-muted-foreground'>
            {user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async (e) => {
            e.preventDefault();
            await logout();
            toast.success('Déconnexion réussie', { id: 'logout_success' });
          }}
        >
          <LucideLogOut /> Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatarMenu;
