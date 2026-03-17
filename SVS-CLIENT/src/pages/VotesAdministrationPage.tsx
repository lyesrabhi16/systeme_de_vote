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
  LucideTrash2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
      toast.error('Échec de la récupération des utilisateurs', {
        id: 'fetch_votes_error',
      });
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
        //console.log('vote row:', vote);
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
        const is_finished = new Date(vote.end_date) < new Date();
        const is_upcoming = new Date(vote.start_date) > new Date();
        return (
          <VoteBadge
            type={
              is_finished
                ? VoteBadgeType.Finished
                : is_upcoming
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
              {
                key: 'delete',
                content: (
                  <>
                    <LucideTrash2 className='w-4 h-4 mr-2' />
                    <span>Supprimer</span>
                  </>
                ),
                variant: 'destructive',
                hide: new Date(row.original.start_date) < new Date(), // Hide delete option if vote has started
                onSelect: () => {
                  const vote = votesMeta?.data.find(
                    (u) => u.id === row.original.id,
                  );
                  if (vote) {
                    setVoteToDelete(vote);
                    setShowDeleteModal(true);
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voteToDelete, setVoteToDelete] = useState<VotesTableData | null>(null);
  return (
    <AppContainer admin noBreadcrumbs>
      <Breadcrumbs />
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <h2 className='text-xl font-semibold'>
                Confirmer la suppression
              </h2>
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce vote ? Cette action est
            irréversible.
          </DialogDescription>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button
              variant={'destructive'}
              onClick={() => {
                if (!voteToDelete?.id) return;
                apiClient()
                  .vote.deleteVote(voteToDelete.id)
                  .then(() => {
                    fetchVotes(1, votesMeta?.items_per_page ?? 10, searchValue);
                    toast.success('Vote supprimé avec succès', {
                      id: 'vote_deleted_success',
                    });
                  })
                  .catch((err) => {
                    console.error('Failed to delete vote:', err);
                    toast.error('Échec de la suppression du vote', {
                      id: 'vote_delete_error',
                    });
                  })
                  .finally(() => {
                    setShowDeleteModal(false);
                  });
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
