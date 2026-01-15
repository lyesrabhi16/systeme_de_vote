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

type UsersTableData = Pick<
  UserResponseModel,
  'id' | 'first_name' | 'last_name' | 'email' | 'is_active'
>;

const AdminsAdministrationPage = () => {
  const [usersMeta, setUsersMeta] =
    useState<PaginatedListResponseUserResponseModel>();
  const fetchUsers = async (page: number, perPage: number) => {
    try {
      const res = await apiClient().admin.getAdmins(page, perPage);
      setUsersMeta({
        ...res.data,
        data: res.data.data,
      });
    } catch (error) {
      console.error(error);
      toast.error('Échec de la récupération des utilisateurs');
    }
  };
  const Breadcrumbs = useBreadCrumbs({
    admin: true,
    additionalLabel: () => ({
      label: 'Gestion des administrateurs',
      links: [],
    }),
  });

  const cols: ColumnDef<UsersTableData>[] = [
    {
      id: 'user',
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Administrateur' />
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
        <div className='flex flex-row gap-1'>
          <UserActivationStateBadge
            user={row.original as UserResponseModel}
            successCallback={() =>
              fetchUsers(usersMeta?.page ?? 1, usersMeta?.items_per_page ?? 10)
            }
          />
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <UserTableActions
          user={row.original as UserResponseModel}
          successCallback={() =>
            fetchUsers(usersMeta?.page ?? 1, usersMeta?.items_per_page ?? 10)
          }
        />
      ),
    },
  ];

  return (
    <AppContainer admin noBreadcrumbs>
      <Breadcrumbs />
      <div className='w-full p-8'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold'>Administrateurs</h2>
          <p className='text-sm text-muted-foreground'>
            Gérer les comptes administrateurs
          </p>
        </div>
        <DataTable
          columns={cols}
          data={usersMeta?.data ?? []}
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
        />
      </div>
    </AppContainer>
  );
};

export default AdminsAdministrationPage;
