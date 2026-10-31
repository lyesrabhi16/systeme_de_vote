import apiClient from '@/api/client';
import type {
  PaginatedListResponseUserResponseModel,
  UserResponseModel,
} from '@/api/sdk';
import AppContainer from '@/components/utils/AppContainer';
import { DataTable } from '@/components/utils/datatable/DataTable';
import { DataTableColumnHeader } from '@/components/utils/datatable/ColumnHeader';
import { useBreadCrumbs } from '@/hooks/useBreadCrumbs';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { toast } from 'sonner';
import UserActivationStateBadge from '@/components/users/UserActivationStateBadge';
import UserTableActions from '@/components/users/UserTableActions';
import UserInfoRow from '@/components/users/UserInfoRow';
import UserFormModal from '@/components/users/UserFormModal';
import { Button } from '@/components/ui/button';
import { LucideSearch, LucideUserPlus } from 'lucide-react';
import InputWithIcons from '@/components/utils/InputWithIcons';
import type { UserFormModalTypes } from '@/utils/user.utils';

export type UsersTableData = Pick<
  UserResponseModel,
  'id' | 'first_name' | 'last_name' | 'email' | 'is_active'
>;

const RegularUsersAdministrationPage = () => {
  const [usersMeta, setUsersMeta] =
    useState<PaginatedListResponseUserResponseModel>();

  const [searchValue, setSearchValue] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<UserResponseModel | null>(
    null,
  );
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormModalType, setUserFormModalType] =
    useState<keyof typeof UserFormModalTypes>('readonly');

  const fetchUsers = async (page: number, perPage: number, search?: string) => {
    try {
      const res = await apiClient().users.getUsers(page, perPage, search);
      setUsersMeta({
        ...res.data,
        data: res.data.data,
      });
    } catch (error) {
      console.error(error);
      toast.error('Échec de la récupération des utilisateurs', {
        id: 'fetch_users_error',
      });
    }
  };

  const Breadcrumbs = useBreadCrumbs({
    admin: true,
    additionalLabel: () => ({
      label: 'Administration des utilisateurs',
      links: [],
    }),
  });

  const cols: ColumnDef<UsersTableData>[] = [
    {
      id: 'user',
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader
          without_hide
          column={column}
          title='Utilisateur'
        />
      ),
      cell: ({ row }) => {
        const user = row.original;

        return <UserInfoRow user={user as UserResponseModel} />;
      },
    },
    {
      accessorKey: 'is_active',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Statut' />
      ),
      cell: ({ row }) => (
        <UserActivationStateBadge
          user={row.original as UserResponseModel}
          successCallback={() =>
            fetchUsers(
              usersMeta?.page ?? 1,
              usersMeta?.items_per_page ?? 10,
              searchValue,
            )
          }
        />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <UserTableActions
          user={row.original as UserResponseModel}
          onView={(user) => {
            setUserFormModalType('readonly');
            setSelectedUser(user);
            setIsUserModalOpen(true);
          }}
          onEdit={(user) => {
            setUserFormModalType('default');
            setSelectedUser(user);
            setIsUserModalOpen(true);
          }}
          onUserUpdated={() =>
            fetchUsers(
              usersMeta?.page ?? 1,
              usersMeta?.items_per_page ?? 10,
              searchValue,
            )
          }
        />
      ),
    },
  ];

  return (
    <AppContainer admin noBreadcrumbs>
      <Breadcrumbs />
      <UserFormModal
        type={userFormModalType}
        user={selectedUser as UserResponseModel}
        open={isUserModalOpen}
        onOpenChange={(open) => {
          setIsUserModalOpen(open);
          if (!open) {
            setSelectedUser(null);
          }
          fetchUsers(
            usersMeta?.page ?? 1,
            usersMeta?.items_per_page ?? 10,
            searchValue,
          );
        }}
      />
      <div className='w-full p-8'>
        <div className='mb-6 flex flex-row flex-wrap items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold'>Utilisateurs</h2>
            <p className='text-sm text-muted-foreground'>
              Gérer les comptes utilisateurs
            </p>
          </div>
        </div>
        <div className='flex flex-row items-center justify-between mb-4'>
          <InputWithIcons
            LeftIcon={LucideSearch}
            input_props={{
              placeholder: 'Search...',
              value: searchValue,
              onChange: (e) => setSearchValue(e.target.value),
            }}
            input_group_props={{
              className: 'max-w-[300px]',
            }}
          />
          <UserFormModal
            type='add'
            onOpenChange={(open, setOpen) => {
              setOpen?.(open);
              fetchUsers(
                usersMeta?.page ?? 1,
                usersMeta?.items_per_page ?? 10,
                searchValue,
              );
            }}
            trigger={
              <Button>
                <LucideUserPlus /> Ajouter un utilisateur
              </Button>
            }
          />
        </div>

        <DataTable
          columns={cols}
          data={usersMeta?.data ?? []}
          search={searchValue}
          metadata={{
            data: usersMeta?.data ?? [],
            page: usersMeta?.page ?? 1,
            has_more: usersMeta?.has_more ?? false,
            total_count: usersMeta?.total_count ?? 0,
            items_per_page: usersMeta?.items_per_page ?? 10,
          }}
          fetchData={fetchUsers}
          initialSortingState={[
            {
              id: 'user',
              desc: false,
            },
          ]}
          onRowDoubleClick={(user_row) => {
            const user = usersMeta?.data.find((u) => u.id === user_row.id);
            if (user) {
              setSelectedUser(user);
              setIsUserModalOpen(true);
            }
          }}
        />
      </div>
    </AppContainer>
  );
};

export default RegularUsersAdministrationPage;
