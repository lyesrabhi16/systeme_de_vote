import { formatDate } from '@/utils/dates';
import apiClient from '@/api/client';
import type { PaginatedListResponseVoteResponseModel, VoteResponseModel } from '@/api/sdk';
import AppContainer from '@/components/utils/AppContainer';
import { DataTable } from '@/components/utils/datatable/DataTable';
import { DataTableColumnHeader } from '@/components/utils/datatable/ColumnHeader';
import { useBreadCrumbs } from '@/hooks/useBreadCrumbs';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  LucideNotepadText,
  LucidePenBox,
  LucideSearch,
  LucideTrash2,
  LucideUserPlus,
} from 'lucide-react';
import InputWithIcons from '@/components/utils/InputWithIcons';
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
  VoteResponseModel,
  'id' | 'title' | 'start_date' | 'end_date' | 'has_been_counted' | 'creator_id'
>;

const getVoteBadgeType = (vote: VotesTableData): VoteBadgeType => {
  if (vote.has_been_counted) return VoteBadgeType.Finished;
  if (new Date(vote.start_date) > new Date()) return VoteBadgeType.Upcoming;
  return VoteBadgeType.Ongoing;
};

const canDelete = (vote: VotesTableData): boolean =>
  new Date(vote.start_date) > new Date() && !vote.has_been_counted;

const VotesAdministrationPage = () => {
  const navigate = useNavigate();

  const [votesMeta, setVotesMeta] = useState<PaginatedListResponseVoteResponseModel>();
  const [searchValue, setSearchValue] = useState<string | undefined>(undefined);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voteToDelete, setVoteToDelete] = useState<VotesTableData | null>(null);
  const [loading, setLoading] = useState(false);

  const getVoteRoute = (data?: Record<string, string | number | undefined>) =>
    routesBuilders.build({ ...data }, routes.VOTE_ADMINISTRATION);

  const fetchVotes = async (page: number, perPage: number, search?: string) => {
    setLoading(true);
    try {
      const res = await apiClient().vote.getAllVotes(page, perPage, search);
      setVotesMeta({ ...res.data });
    } catch (error) {
      console.error(error);
      toast.error('Échec de la récupération des votes', {
        id: 'fetch_votes_error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
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
        setVoteToDelete(null);
      });
  };

  const Breadcrumbs = useBreadCrumbs({
    admin: true,
    additionalLabel: () => ({
      label: 'Gestion des Votes',
      links: [],
    }),
  });

  const cols = useMemo<ColumnDef<VotesTableData>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <DataTableColumnHeader without_hide column={column} title='Titre' />
        ),
        cell: ({ row }) => {
          const { title, start_date, end_date } = row.original;
          return (
            <div>
              <p className='font-medium'>{title}</p>
              <p className='text-sm text-muted-foreground'>
                {formatDate(start_date)} —{' '}
                {formatDate(end_date)}
              </p>
            </div>
          );
        },
      },
      {
        id: 'state_badge',
        accessorFn: (row) => getVoteBadgeType(row),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Statut' />
        ),
        cell: ({ row }) => <VoteBadge type={getVoteBadgeType(row.original)} />,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const vote = row.original;
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
                  onSelect: () =>
                    navigate(getVoteRoute({ voteId: vote.id!.toString() })),
                },
                {
                  key: 'edit',
                  content: (
                    <>
                      <LucidePenBox className='w-4 h-4 mr-2' />
                      <span>Modifier</span>
                    </>
                  ),
                  onSelect: () =>
                    navigate(
                      getVoteRoute({
                        voteId: vote.id!.toString(),
                        type: 'edit',
                      }),
                    ),
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
                  hide: !canDelete(vote),
                  onSelect: () => {
                    setVoteToDelete(vote);
                    setShowDeleteModal(true);
                  },
                },
              ]}
            />
          );
        },
      },
    ],
    // navigate and state setters are stable — no extra deps needed
    [navigate],
  );

  return (
    <AppContainer admin noBreadcrumbs>
      <Breadcrumbs />

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le vote{' '}
            <span className='font-medium text-foreground'>
              « {voteToDelete?.title} »
            </span>{' '}
            ? Cette action est irréversible.
          </DialogDescription>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='w-full p-4 sm:p-8'>
        {/* Page header */}
        <div className='mb-6'>
          <h2 className='text-2xl font-bold'>Votes</h2>
          <p className='text-sm text-muted-foreground'>Gestion des votes</p>
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
          <Button onClick={() => navigate(getVoteRoute())}>
            <LucideUserPlus className='w-4 h-4 mr-2' />
            Ajouter un sujet de vote
          </Button>
        </div>

        <DataTable
          columns={cols}
          data={votesMeta?.data ?? []}
          search={searchValue}
          loading={loading}
          metadata={{
            data: votesMeta?.data ?? [],
            page: votesMeta?.page ?? 1,
            has_more: votesMeta?.has_more ?? false,
            total_count: votesMeta?.total_count ?? 0,
            items_per_page: votesMeta?.items_per_page ?? 10,
          }}
          fetchData={fetchVotes}
          initialSortingState={[{ id: 'title', desc: false }]}
          onRowDoubleClick={(row) => {
            if (row.id) {
              navigate(getVoteRoute({ voteId: row.id.toString() }));
            }
          }}
        />
      </div>
    </AppContainer>
  );
};

export default VotesAdministrationPage;
