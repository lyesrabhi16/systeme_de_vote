import { useState } from 'react';
import type { UserResponseModel } from '@/api/sdk';
import {
  LucideNotepadText,
  LucidePenBox,
  LucideUserCheck,
  LucideUserX,
} from 'lucide-react';
import ActionButtonContent from '@/components/users/ActionButtonContent';
import { SwitchUserActivationState } from '@/utils/user.utils';
import TableActions from '@/components/utils/datatable/TableActions';

type UserTableActionsProps = {
  user: UserResponseModel;
  onView: (user: UserResponseModel) => void;
  onEdit: (user: UserResponseModel) => void;
  onUserUpdated: (user: UserResponseModel) => void;
};

const UserTableActions = ({
  user,
  onView,
  onEdit,
  onUserUpdated,
}: UserTableActionsProps) => {
  const [loading, setLoading] = useState(false);
  return (
    <TableActions
      items={[
        {
          key: 'view',
          content: (
            <>
              <LucideNotepadText className='mr-2 h-4 w-4' />
              Consulter
            </>
          ),
          onSelect: () => {
            onView(user);
          },
        },
        {
          key: 'edit',
          content: (
            <>
              <LucidePenBox className='mr-2 h-4 w-4' />
              Modifier
            </>
          ),
          onSelect: () => {
            onEdit(user);
          },
        },
        {
          key: 'toggle-activation',
          content: (
            <ActionButtonContent
              loadingState={loading}
              icon={user.is_active ? <LucideUserX /> : <LucideUserCheck />}
            >
              {user.is_active ? 'Désactiver' : 'Activer'}
            </ActionButtonContent>
          ),
          variant: user.is_active ? 'destructive' : undefined,
          onSelect: async () => {
            await SwitchUserActivationState(user, setLoading);
            onUserUpdated({
              ...user,
              is_active: !user.is_active,
            });
          },
        },
      ]}
    />
  );
};

export default UserTableActions;
