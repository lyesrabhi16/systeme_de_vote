import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormField from '@/components/vote/editor/FormField';
import type { ElectionFormValues } from '@/schemas/vote.schemas';
import { LucidePlus, LucideTrash2 } from 'lucide-react';
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';

const MIN = 2;
const MAX = 30;

/** The candidates, as rows to fill in. Nothing is sent until the election is saved: the list is replaced as a whole. */
const CandidatesEditor = (props: {
  control: Control<ElectionFormValues>;
  register: UseFormRegister<ElectionFormValues>;
  errors: FieldErrors<ElectionFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({ control: props.control, name: 'candidates' });
  const rowErrors = props.errors.candidates;

  return (
    <div className='flex flex-col gap-4'>
      <ul className='flex flex-col gap-3'>
        {fields.map((field, index) => {
          const error = Array.isArray(rowErrors) ? rowErrors[index] : undefined;
          return (
            <li key={field.id} className='rounded-xl border bg-background p-4'>
              <div className='mb-3 flex items-center justify-between'>
                <p className='text-sm font-medium text-muted-foreground'>Candidat {index + 1}</p>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='text-muted-foreground hover:text-destructive'
                  disabled={fields.length <= 1}
                  onClick={() => remove(index)}
                  aria-label={`Retirer le candidat ${index + 1}`}
                >
                  <LucideTrash2 /> Retirer
                </Button>
              </div>
              <div className='grid gap-3 sm:grid-cols-2'>
                <FormField id={`candidate-${index}-first`} label='Prénom' error={error?.first_name?.message}>
                  <Input
                    id={`candidate-${index}-first`}
                    autoComplete='off'
                    aria-invalid={!!error?.first_name}
                    {...props.register(`candidates.${index}.first_name`)}
                  />
                </FormField>
                <FormField id={`candidate-${index}-last`} label='Nom' error={error?.last_name?.message}>
                  <Input
                    id={`candidate-${index}-last`}
                    autoComplete='off'
                    aria-invalid={!!error?.last_name}
                    {...props.register(`candidates.${index}.last_name`)}
                  />
                </FormField>
                <FormField
                  id={`candidate-${index}-photo`}
                  label='Photo (facultatif)'
                  hint="L'adresse d'une image"
                  error={error?.photo_url?.message}
                  className='sm:col-span-2'
                >
                  <Input
                    id={`candidate-${index}-photo`}
                    type='url'
                    inputMode='url'
                    placeholder='https://…'
                    autoComplete='off'
                    aria-invalid={!!error?.photo_url}
                    {...props.register(`candidates.${index}.photo_url`)}
                  />
                </FormField>
              </div>
            </li>
          );
        })}
      </ul>
      {typeof rowErrors?.message === 'string' && (
        <p role='alert' className='text-sm text-destructive'>
          {rowErrors.message}
        </p>
      )}
      {typeof props.errors.candidates?.root?.message === 'string' && (
        <p role='alert' className='text-sm text-destructive'>
          {props.errors.candidates.root.message}
        </p>
      )}
      <div className='flex items-center justify-between gap-3'>
        <p className='text-xs text-muted-foreground'>
          {fields.length < MIN ? `Il en faut au moins ${MIN}.` : `${fields.length} candidats. Ils ne pourront plus être changés à l'ouverture.`}
        </p>
        <Button
          type='button'
          variant='outline'
          disabled={fields.length >= MAX}
          onClick={() => append({ first_name: '', last_name: '', photo_url: '' }, { shouldFocus: true })}
        >
          <LucidePlus /> Ajouter un candidat
        </Button>
      </div>
    </div>
  );
};

export default CandidatesEditor;
