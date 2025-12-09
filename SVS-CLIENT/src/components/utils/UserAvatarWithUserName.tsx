import type { UserResponseModel } from '@/api/sdk';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getUserInitials, getUserName } from '@/utils/user.utils';

const UserAvatarWithUserName = (props: { user: UserResponseModel }) => {
  return (
    <div className='flex flex-row flex-nowrap gap-2 justify-center items-center'>
      <Avatar className='w-8 h-8'>
        <AvatarFallback>{getUserInitials(props.user)}</AvatarFallback>
      </Avatar>
      <p className='ml-2 text-sm text-muted-foreground'>
        {getUserName(props.user)}
      </p>
    </div>
  );
};

export default UserAvatarWithUserName;
