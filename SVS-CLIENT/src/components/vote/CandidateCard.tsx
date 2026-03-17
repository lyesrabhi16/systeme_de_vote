import apiClient from '@/api/client';
import type { Candidate } from '@/api/sdk';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import CandidateFormModal from '@/components/vote/CandidateFormModal';
import { DialogTitle } from '@radix-ui/react-dialog';
import {
  LucidePenBox,
  LucideUserCircle,
  LucideX,
  MoreVertical,
} from 'lucide-react';
import { useState } from 'react';

const CandidateCard = (props: {
  candidate: Candidate;
  isWinner?: boolean;
  selected?: boolean;
  disabled?: boolean;
  isVoteFinished?: boolean;
  onClick?: () => void;
  editable?: boolean;
  onUpdated?: (candidate?: Candidate) => void;
  onDelete?: () => void;
}) => {
  const { candidate, isWinner, selected: _selected, disabled, onClick } = props;
  const color = isWinner ? 'border-green-500' : 'border-primary';
  const selected = (_selected && !disabled) || isWinner;
  const [loading, setLoading] = useState({
    delete: false,
    edit: false,
  });
  const onDelete = () => {
    if (props.onDelete) {
      props.onDelete();
      return;
    }
    setLoading((prev) => ({ ...prev, delete: true }));
    apiClient()
      .candidates.deleteCandidate(candidate.id as number)
      .then(() => {
        //console.log('Candidate deleted');
        props.onUpdated?.();
      })
      .catch((err) => {
        console.error('Failed to delete candidate:', err);
      })
      .finally(() => {
        setLoading((prev) => ({ ...prev, delete: false }));
        setOpenDeleteAlert(false);
      });
  };
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
  const [openCandidateForm, setOpenCandidateForm] = useState(false);
  return (
    <Card
      key={candidate.id}
      onClick={onClick}
      className={
        selected
          ? `w-64 flex flex-col w-full flex-nowrap gap-2 justify-center items-center ${
              disabled ? '' : 'scale-110 cursor-pointer'
            } transition-transform duration-200 border-2 ${color} px-0 pt-0`
          : `w-64 flex flex-col w-full flex-nowrap gap-2 justify-center items-center ${
              disabled ? '' : 'hover:scale-110 cursor-pointer'
            } transition-transform duration-200 pt-1 `
      }
    >
      <Dialog open={openDeleteAlert} onOpenChange={setOpenDeleteAlert}>
        <DialogContent>
          <DialogTitle> Supprimer le candidat </DialogTitle>
          Êtes-vous sûr de vouloir supprimer le candidat {
            candidate.first_name
          }{' '}
          {candidate.last_name} ? Cette action est irréversible.
          <DialogFooter>
            <Button variant='ghost' onClick={() => setOpenDeleteAlert(false)}>
              Annuler
            </Button>
            <Button
              variant='destructive'
              onClick={onDelete}
              disabled={loading.delete}
            >
              {loading.delete ? (
                <>
                  <Spinner /> Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CandidateFormModal
        formType='edit'
        open={openCandidateForm}
        onOpenChange={setOpenCandidateForm}
        onSubmit={(updatedCandidate) => {
          if (props.onUpdated) {
            props.onUpdated(updatedCandidate as Candidate);
          }
        }}
        initialData={{ ...candidate } as any}
      />

      <CardHeader className='w-full p-0'>
        {props.editable && (
          <div className='w-full flex flex-row flex-nowrap items-center justify-between'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='hover:bg-muted-foreground/10 rounded-full p-1 mr-auto'
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onSelect={() => {
                    setOpenCandidateForm(true);
                  }}
                >
                  <LucidePenBox /> Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant='destructive'
                  onSelect={() => setOpenDeleteAlert(true)}
                >
                  <LucideX /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant='ghost'
              className='hover:text-destructive hover:bg-destructive/10 rounded-full p-1 ml-auto'
              onClick={(e) => {
                e.preventDefault();
                setOpenDeleteAlert(true);
              }}
            >
              <LucideX size={16} />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className='flex flex-col items-center'>
        {candidate.photo_url === '' ||
        candidate.photo_url === undefined ||
        candidate.photo_url === null ? (
          <LucideUserCircle size={64} />
        ) : (
          <img
            src={candidate.photo_url}
            alt={`${candidate.first_name} ${candidate.last_name}`}
            className='w-16 h-16 mb-2 rounded-full'
          />
        )}
        <h2 className='text-lg font-semibold'>
          {candidate.first_name} {candidate.last_name}{' '}
        </h2>
        {isWinner && (
          <Badge className='bg-green-500 text-white w-16 text-center py-1 m-0'>
            Élu
          </Badge>
        )}
        {props.isVoteFinished && (
          <p className='text-sm text-muted-foreground mt-2'>
            Votes: {candidate.vote_count ?? 0}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateCard;
