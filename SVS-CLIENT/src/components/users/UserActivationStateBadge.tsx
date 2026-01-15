import { useState } from 'react';
import type { UserResponseModel } from '@/api/sdk';
import { SwitchUserActivationState } from '@/utils/user.utils';
import CheckBadge from '@/components/utils/CheckBadge';

const UserActivationStateBadge = (props: {
  user: UserResponseModel;
  successCallback?: () => void;
}) => {
  const { user } = props;
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <CheckBadge
      successText='Actif'
      failText='Inactif'
      test={() => user.is_active}
      className={user.is_active ? 'bg-primary' : undefined}
      variant={user.is_active ? 'default' : 'destructive'}
      loading={loading}
      onClick={() => {
        SwitchUserActivationState(user, setLoading).then(() => {
          if (props.successCallback) {
            props.successCallback();
          }
        });
      }}
    />
  );
};

export default UserActivationStateBadge;
