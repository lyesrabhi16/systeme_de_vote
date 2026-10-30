import { Button } from '@/components/ui/button';
import { LucideCheck, LucideCopy } from 'lucide-react';
import { useState } from 'react';

/** Copies a text, and says so. (The clipboard exists on https pages and on localhost; elsewhere the text can still be selected.) */
const CopyButton = (props: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(props.text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? <LucideCheck /> : <LucideCopy />}
      {copied ? 'Copié' : (props.label ?? 'Copier')}
    </Button>
  );
};

export default CopyButton;
