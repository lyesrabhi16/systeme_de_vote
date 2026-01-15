import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserResponseModel } from '@/api/sdk';
import {
  LucideNotepadText,
  LucidePenBox,
  LucideUserCheck,
  LucideUserX,
  MoreHorizontal,
} from 'lucide-react';
import ActionButtonContent from '@/components/users/ActionButtonContent';
import { SwitchUserActivationState } from '@/utils/user.utils';

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
    <div className="flex justify-end">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onView(user)}>
            <LucideNotepadText />
            Voir les détails
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => onEdit(user)}>
            <LucidePenBox />
            Modifier l'utilisateur
          </DropdownMenuItem>

          <DropdownMenuItem
            variant={user.is_active ? 'destructive' : undefined}
            disabled={loading}
            onClick={async () => {
              await SwitchUserActivationState(user, setLoading);
              onUserUpdated({ ...user, is_active: !user.is_active });
            }}
          >
            <ActionButtonContent
              loadingState={loading}
              icon={user.is_active ? <LucideUserX /> : <LucideUserCheck />}
            >
              {user.is_active ? 'Désactiver' : 'Activer'}
            </ActionButtonContent>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserTableActions;
