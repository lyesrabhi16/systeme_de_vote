import type { UserResponseModel } from '@/api/sdk';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getUserInitials, getUserName } from '@/utils/user.utils';
import { useEffect } from 'react';

const UserAvatarWithUserName = (props: {
  user: UserResponseModel;
  containerClassName?: string;
  avatarClassName?: string;
}) => {
  useEffect(() => {
    console.log('userAvatar: ', props.user);
  });
  return (
    <div
      className={cn(
        'flex flex-row flex-nowrap gap-2 justify-center items-center',
        props.containerClassName,
      )}
    >
      <Avatar className={cn('w-8 h-8', props.avatarClassName)}>
        <AvatarFallback>{getUserInitials(props.user)}</AvatarFallback>
      </Avatar>
      <p className='ml-2 text-sm text-muted-foreground'>
        {getUserName(props.user)}
      </p>
    </div>
  );
};

export default UserAvatarWithUserName;
