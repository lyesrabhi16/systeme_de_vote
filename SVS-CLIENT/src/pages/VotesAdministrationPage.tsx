import apiClient from '@/api/client';
import type { PaginatedListResponseVote, Vote } from '@/api/sdk';
import AppContainer from '@/components/utils/AppContainer';
import { DataTable } from '@/components/utils/datatable/DataTable';
import { DataTableColumnHeader } from '@/components/utils/datatable/ColumnHeader';
import { useBreadCrumbs } from '@/hooks/useBreadCrumbs';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  LucideNotepadText,
  LucidePenBox,
  LucideSearch,
  LucideUserPlus,
} from 'lucide-react';
import InputWithIcons from '@/components/utils/InputWithIcons';
import type { UserFormModalTypes } from '@/utils/user.utils';
import VoteBadge from '@/components/home/VoteBadge';
import { VoteBadgeType } from '@/utils/vote.utils';
import TableActions from '@/components/utils/datatable/TableActions';
import { Button } from '@/components/ui/button';
import { routes, routesBuilders } from '@/services/routing';
import { useNavigate } from 'react-router';

type VotesTableData = Pick<
  Vote,
  'id' | 'title' | 'start_date' | 'end_date' | 'has_been_counted' | 'creator_id'
>;

const VotesAdministrationPage = () => {
  const [votesMeta, setVotesMeta] = useState<PaginatedListResponseVote>();

  const [searchValue, setSearchValue] = useState<string | undefined>(undefined);
  useState<keyof typeof UserFormModalTypes>('readonly');

  const fetchVotes = async (page: number, perPage: number, search?: string) => {
    try {
      const res = await apiClient().vote.getAllVotes(page, perPage, search);
      setVotesMeta({
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
      label: 'Gestion des Votes',
      links: [],
    }),
  });

  const cols: ColumnDef<VotesTableData>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader without_hide column={column} title='Titre' />
      ),
      cell: ({ row }) => {
        const vote = row.original;
        console.log('vote row:', vote);
        return (
          <div>
            <p className='font-medium'>{vote.title}</p>
            <p className='text-sm text-muted-foreground'>
              {new Date(vote.start_date).toLocaleDateString()} —{' '}
              {new Date(vote.end_date).toLocaleDateString()}
            </p>
          </div>
        );
      },
    },
    {
      id: 'state_badge',
      //accessorKey: 'state_badge',
      accessorFn: (row) => {
        return row.has_been_counted
          ? VoteBadgeType.Finished
          : new Date(row.start_date) > new Date()
          ? VoteBadgeType.Upcoming
          : VoteBadgeType.Ongoing;
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Statut' />
      ),

      cell: ({ row }) => {
        const vote = row.original;
        return (
          <VoteBadge
            type={
              vote.has_been_counted
                ? VoteBadgeType.Finished
                : new Date(vote.start_date) > new Date()
                ? VoteBadgeType.Upcoming
                : VoteBadgeType.Ongoing
            }
          />
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <TableActions
            items={[
              {
                key: 'view',
                content: (
                  <>
                    <LucideNotepadText className='w-4 h-4 mr-2' />
                    <span>Consulter</span>
                  </>
                ),
                onSelect: () => {
                  const vote = votesMeta?.data.find(
                    (u) => u.id === row.original.id,
                  );
                  if (vote) {
                    navigate(getVoteRoute({ voteId: vote.id!.toString() }));
                  }
                },
              },
              {
                key: 'edit',
                content: (
                  <>
                    <LucidePenBox className='w-4 h-4 mr-2' />
                    <span>Modifier</span>
                  </>
                ),
                onSelect: () => {
                  const vote = votesMeta?.data.find(
                    (u) => u.id === row.original.id,
                  );
                  if (vote) {
                    navigate(
                      getVoteRoute({
                        voteId: vote.id!.toString(),
                        type: 'edit',
                      }),
                    );
                  }
                },
              },
            ]}
          />
        );
      },
    },
  ];
  const getVoteRoute = (data?: Record<string, string | number | undefined>) => {
    return routesBuilders.build({ ...data }, routes.VOTE_ADMINISTRATION);
  };
  const navigate = useNavigate();

  return (
    <AppContainer admin noBreadcrumbs>
      <Breadcrumbs />
      <div className='w-full p-8'>
        <div className='mb-6 flex flex-row flex-wrap items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold'>Votes</h2>
            <p className='text-sm text-muted-foreground'>Gestion des votes</p>
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
          <Button
            onClick={() => {
              navigate(getVoteRoute());
            }}
          >
            <LucideUserPlus /> Ajouter un Sujet de Vote
          </Button>
        </div>

        <DataTable
          columns={cols}
          data={votesMeta?.data ?? []}
          search={searchValue}
          metadata={{
            data: votesMeta?.data ?? [],
            page: votesMeta?.page ?? 1,
            has_more: votesMeta?.has_more ?? false,
            total_count: votesMeta?.total_count ?? 0,
            items_per_page: votesMeta?.items_per_page ?? 10,
          }}
          fetchData={fetchVotes}
          initialSortingState={[
            {
              id: 'title',
              desc: false,
            },
          ]}
          onRowDoubleClick={(row) => {
            const vote = votesMeta?.data.find((u) => u.id === row.id);
            if (vote) {
              navigate(getVoteRoute({ voteId: vote.id!.toString() }));
            }
          }}
        />
      </div>
    </AppContainer>
  );
};

export default VotesAdministrationPage;
