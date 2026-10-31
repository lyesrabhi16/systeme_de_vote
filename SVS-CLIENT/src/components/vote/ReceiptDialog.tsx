import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CopyButton from '@/components/vote/CopyButton';
import { LucideCircleCheck } from 'lucide-react';

/** Shown once, right after a vote: the receipt. (It is also emailed.) */
const ReceiptDialog = (props: { code: string | null; onClose: () => void }) => (
  <Dialog open={props.code !== null} onOpenChange={(open) => !open && props.onClose()}>
    <DialogContent className='max-w-md'>
      <DialogHeader className='items-center text-center sm:text-center'>
        <span className='mb-2 flex size-14 items-center justify-center rounded-full bg-success-soft text-success'>
          <LucideCircleCheck className='size-8' />
        </span>
        <DialogTitle className='font-display text-2xl'>Vote enregistré</DialogTitle>
        <DialogDescription>
          Votre bulletin chiffré est sur le tableau d'affichage public. Voici votre reçu : il vous permet de l'y retrouver,
          et il ne révèle pas votre choix.
        </DialogDescription>
      </DialogHeader>
      <div className='flex flex-col gap-3 rounded-xl bg-muted p-4'>
        <p className='text-xs uppercase tracking-wide text-muted-foreground'>Votre reçu</p>
        <code className='select-all break-all font-mono text-sm'>{props.code}</code>
        {props.code && <CopyButton text={props.code} label='Copier le reçu' />}
      </div>
      <p className='text-center text-xs text-muted-foreground'>
        Il vous a aussi été envoyé par e-mail. Il n'est pas affiché une seconde fois ici.
      </p>
      <DialogFooter>
        <Button className='w-full' onClick={props.onClose}>
          Fermer
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ReceiptDialog;
