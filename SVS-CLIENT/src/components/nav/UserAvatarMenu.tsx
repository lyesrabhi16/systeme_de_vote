import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useAuth from '@/hooks/useAuth';
import { getUserInitials, getUserName } from '@/utils/user.utils';
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';
import { DropdownMenu } from '@radix-ui/react-dropdown-menu';
import { toast } from 'sonner';

const UserAvatarMenu = () => {
  const { user, logout } = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className='flex flex-row flex-nowrap gap-4 items-center cursor-pointer'>
          <span className='text-sm font-medium'>{getUserName(user)}</span>
          <Avatar className='rounded-full w-10 h-10'>
            <AvatarFallback className='text-lg bg-muted-foreground/10 flex items-center justify-center rounded-full w-10 h-10'>
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className='font-semibold'>
          {getUserName(user)}
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => {
            toast.error('Not Implemented yet');
          }}
        >
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async (e) => {
            e.preventDefault();
            await logout();
            toast.success('Déconnexion réussie');
          }}
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatarMenu;
