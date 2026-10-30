import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Image, Vote } from 'lucide-react';
import { CandidateFormSchema } from '@/schemas/candidate.schemas';
import SectionHeader from '@/components/utils/SectionHeader';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

type CandidateFormData = z.infer<typeof CandidateFormSchema>;



export default function CandidateFormModal({
  formType = 'add',
  initialData,
  onSubmit,
  trigger,
  open,
  onOpenChange,
}: {
  formType: 'add' | 'edit' | 'readonly';
  initialData: Partial<CandidateFormData>;
  onSubmit?: (data: CandidateFormData) => void;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const form = useForm({
    resolver: zodResolver(CandidateFormSchema),
    defaultValues: {
      vote_id: initialData.vote_id || undefined,
      first_name: initialData.first_name || '',
      last_name: initialData.last_name || '',
      photo_url: initialData.photo_url || undefined,
    },
  });

  const handleSubmit = (data: CandidateFormData) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  const handleError = () => {
    //console.log('Form errors:', errors);
    toast.error('Corriger les erreurs dans le formulaire', {
      id: 'form_validation_error',
    });
  };

  const onFormSubmit = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    form.handleSubmit(handleSubmit, handleError)(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <div className=''>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            {formType === 'add'
              ? 'Ajouter un candidat'
              : formType === 'edit'
                ? 'Modifier le candidat'
                : 'Détails du candidat'}
          </h2>

          <div className='space-y-6'>
            {/* Personal Information Section */}
            <div className='space-y-4'>
              <SectionHeader icon={User} title='Informations personnelles' />
              <FieldGroup className='space-y-4'>
                <Controller
                  name='last_name'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='last_name'>
                        Nom de famille
                      </FieldLabel>
                      <Input
                        id='last_name'
                        placeholder='Entrez le nom de famille'
                        disabled={formType === 'readonly'}
                        {...field}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name='first_name'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='first_name'>Prénom</FieldLabel>
                      <Input
                        id='first_name'
                        placeholder='Entrez le prénom'
                        disabled={formType === 'readonly'}
                        {...field}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </div>

            {/* Vote Information Section */}
            {formType !== 'add' && (
              <div className='space-y-4'>
                <SectionHeader icon={Vote} title='Informations de vote' />
                <FieldGroup className='space-y-4'>
                  <Controller
                    name='vote_id'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='vote_id'>ID de vote</FieldLabel>
                        <Input
                          id='vote_id'
                          type='number'
                          placeholder='ID de vote (optionnel)'
                          disabled={formType === 'readonly'}
                          {...field}
                          value={field.value || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            )
                          }
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </div>
            )}

            {/* Photo Section */}
            <div className='space-y-4'>
              <SectionHeader icon={Image} title='Photo du candidat' />
              <FieldGroup className='space-y-4'>
                <Controller
                  name='photo_url'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='photo_url'>
                        URL de la photo
                      </FieldLabel>
                      <Input
                        id='photo_url'
                        type='url'
                        placeholder='https://exemple.com/photo.jpg (optionnel)'
                        disabled={formType === 'readonly'}
                        {...field}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                      {field.value && !fieldState.error && (
                        <div className='mt-2'>
                          <img
                            src={field.value}
                            alt='Aperçu de la photo du candidat'
                            className='w-32 h-32 object-cover rounded-md border border-gray-300'
                            onError={(
                              e: React.SyntheticEvent<HTMLImageElement, Event>,
                            ) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </div>

            {/* Actions */}
            {formType !== 'readonly' && (
              <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
                <Button type='button' variant='outline' onClick={
                  () => onOpenChange?.(false)
                }>
                  Fermer
                </Button>
                <Button onClick={onFormSubmit} variant='default'>
                  {formType === 'add'
                    ? 'Créer le candidat'
                    : 'Enregistrer les modifications'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
