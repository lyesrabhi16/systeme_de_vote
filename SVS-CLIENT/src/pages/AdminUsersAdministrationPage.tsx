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
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import UserActivationStateBadge from '@/components/users/UserActivationStateBadge';
import UserTableActions from '@/components/users/UserTableActions';
import UserInfoRow from '@/components/users/UserInfoRow';
import UserFormModal from '@/components/users/UserFormModal';
import InputWithIcons from '@/components/utils/InputWithIcons';
import { LucideSearch, LucideUserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserFormModalTypes } from '@/utils/user.utils';
import UserAuthorityTypeBadge from '@/components/users/AdminAuthorityTypeBadge';

type UsersTableData = Pick<
  UserResponseModel,
  'id' | 'first_name' | 'last_name' | 'email' | 'is_active'
>;

const AdminsAdministrationPage = () => {
  const [usersMeta, setUsersMeta] =
    useState<PaginatedListResponseUserResponseModel>();
  const [searchValue, setSearchValue] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<UserResponseModel | null>(
    null,
  );
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormModalType, setUserFormModalType] =
    useState<keyof typeof UserFormModalTypes>('readonly');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (page: number, perPage: number, search?: string) => {
    setLoading(true);
    try {
      const res = await apiClient().admin.getAdmins(page, perPage, search);
      setUsersMeta({ ...res.data });
    } catch (error) {
      console.error(error);
      toast.error('Échec de la récupération des administrateurs', {
        id: 'fetch_admins_error',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrentPage = (search = searchValue) =>
    fetchUsers(usersMeta?.page ?? 1, usersMeta?.items_per_page ?? 10, search);

  const openUserModal = (
    user: UserResponseModel,
    type: keyof typeof UserFormModalTypes,
  ) => {
    setUserFormModalType(type);
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const Breadcrumbs = useBreadCrumbs({
    admin: true,
    additionalLabel: () => ({
      label: 'Gestion des administrateurs',
      links: [],
    }),
  });

  const cols = useMemo<ColumnDef<UsersTableData>[]>(
    () => [
      {
        id: 'user',
        accessorKey: 'email',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Administrateur' />
        ),
        cell: ({ row }) => (
          <UserInfoRow user={row.original as UserResponseModel} />
        ),
      },
      {
        accessorKey: 'is_active',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Statut' />
        ),
        cell: ({ row }) => (
          <UserActivationStateBadge
            user={row.original as UserResponseModel}
            successCallback={refreshCurrentPage}
          />
        ),
      },
      {
        accessorKey: 'authority',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Autorité' />
        ),
        cell: ({ row }) => (
          <UserAuthorityTypeBadge
            user={row.original as UserResponseModel}
            successCallback={refreshCurrentPage}
          />
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <UserTableActions
            user={row.original as UserResponseModel}
            onView={(user) => openUserModal(user, 'readonly')}
            onEdit={(user) => openUserModal(user, 'default')}
            onUserUpdated={() => refreshCurrentPage(searchValue)}
          />
        ),
      },
    ],
    // refreshCurrentPage is stable within a render cycle; usersMeta page/size
    // are captured via the closure — cols rebuild when those change
    [usersMeta?.page, usersMeta?.items_per_page, searchValue],
  );

  return (
    <AppContainer admin noBreadcrumbs>
      <Breadcrumbs />

      {/* View / edit modal (opened from row actions or double-click) */}
      <UserFormModal
        admin
        type={userFormModalType}
        user={selectedUser as UserResponseModel}
        open={isUserModalOpen}
        onOpenChange={(open) => {
          setIsUserModalOpen(open);
          if (!open) {
            setSelectedUser(null);
            refreshCurrentPage();
          }
        }}
      />

      <div className='w-full p-4 sm:p-8'>
        {/* Page header */}
        <div className='mb-6'>
          <h2 className='text-2xl font-bold'>Administrateurs</h2>
          <p className='text-sm text-muted-foreground'>
            Gérer les comptes administrateurs
          </p>
        </div>

        {/* Toolbar */}
        <div className='flex flex-row items-center justify-between mb-4 gap-4 flex-wrap'>
          <InputWithIcons
            LeftIcon={LucideSearch}
            input_props={{
              placeholder: 'Rechercher...',
              value: searchValue,
              onChange: (e) => setSearchValue(e.target.value),
            }}
            input_group_props={{ className: 'max-w-[300px]' }}
          />
          <UserFormModal
            type='add'
            admin
            onOpenChange={(open, setOpen) => {
              setOpen?.(open);
              refreshCurrentPage();
            }}
            trigger={
              <Button>
                <LucideUserPlus className='w-4 h-4 mr-2' />
                Ajouter un administrateur
              </Button>
            }
          />
        </div>

        <DataTable
          columns={cols}
          data={usersMeta?.data ?? []}
          search={searchValue}
          loading={loading}
          metadata={{
            data: usersMeta?.data ?? [],
            page: usersMeta?.page ?? 1,
            has_more: usersMeta?.has_more ?? false,
            total_count: usersMeta?.total_count ?? 0,
            items_per_page: usersMeta?.items_per_page ?? 10,
          }}
          fetchData={fetchUsers}
          initialSortingState={[{ id: 'user', desc: false }]}
          onRowDoubleClick={(row) =>
            openUserModal(row as UserResponseModel, 'readonly')
          }
        />
      </div>
    </AppContainer>
  );
};

export default AdminsAdministrationPage;
