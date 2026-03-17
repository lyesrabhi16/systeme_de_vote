import { useState } from 'react';
import {
  CurrentUserResponseModelAuthorityEnum,
  type UserResponseModel,
} from '@/api/sdk';
import ActionBadge from '@/components/utils/ActionBadge';
import { LucideUserSquare2, LucideVote } from 'lucide-react';
import { SwitchUserAuthority } from '@/utils/user.utils';

const UserAuthorityTypeBadge = (props: {
  user: UserResponseModel;
  disabled?: boolean;
  onClick?: () => void;
  successCallback?: () => void;
}) => {
  const { user } = props;
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <ActionBadge
      disabled={props.disabled}
      text={user.authority?.toLocaleUpperCase() || 'INCONNU'}
      icon={
        user.authority === CurrentUserResponseModelAuthorityEnum.Inscription ? (
          <LucideUserSquare2 size={16} />
        ) : (
          <LucideVote size={16} />
        )
      }
      className={
        user.authority === CurrentUserResponseModelAuthorityEnum.Inscription
          ? 'bg-primary px-2 py-1'
          : 'bg-green-600 px-2 py-1'
      }
      loading={loading}
      onClick={
        props.onClick ||
        (() => {
          SwitchUserAuthority(user, setLoading).then(() => {
            if (props.successCallback) {
              props.successCallback();
            }
          });
        })
      }
    />
  );
};

export default UserAuthorityTypeBadge;
