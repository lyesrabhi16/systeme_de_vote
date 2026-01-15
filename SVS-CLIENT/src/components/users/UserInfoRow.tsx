import type { UserResponseModel } from '@/api/sdk';
import { Badge } from '@/components/ui/badge';
import { getUserInitials } from '@/utils/user.utils';

const UserInfoRow = (props: { user: UserResponseModel }) => {
  return (
    <div className='flex items-center gap-3'>
      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium'>
        {getUserInitials(props.user)}
      </div>
      <div className='flex flex-col'>
        <span className='text-sm font-medium'>
          {props.user.first_name} {props.user.last_name}
        </span>
        <span className='text-xs text-muted-foreground'>
          {props.user.email}
        </span>
        {props.user.is_admin && (
          <Badge variant='secondary' className='px-4 py-1 mt-1 text-xs'>
            ADMIN
          </Badge>
        )}
      </div>
    </div>
  );
};

export default UserInfoRow;
