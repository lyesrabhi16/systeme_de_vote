import z from 'zod';
import { parseInputValue } from '@/utils/dates';

export const CandidateRowSchema = z.object({
  first_name: z.string().trim().min(1, 'Le prénom est requis').max(100),
  last_name: z.string().trim().min(1, 'Le nom est requis').max(100),
  // optional: an address of a picture; nothing is the same as an empty field
  photo_url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\//i.test(v), "L'adresse de la photo doit commencer par http:// ou https://"),
});

/**
 * An election as the editor holds it. The dates are what the date and time fields hold (the wall clock of the person who edits):
 * they become moments (UTC) when the form is sent. The electoral roll is not in this form: it is chosen apart, and sent only when it changes.
 */
export const ElectionFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Le titre est requis').max(200, '200 caractères au plus'),
    description: z.string().trim().min(1, 'La description est requise').max(1000, '1000 caractères au plus'),
    start: z.string().refine((v) => parseInputValue(v) !== null, 'La date et l\'heure d\'ouverture sont requises'),
    end: z.string().refine((v) => parseInputValue(v) !== null, 'La date et l\'heure de clôture sont requises'),
    candidates: z.array(CandidateRowSchema).min(2, 'Au moins 2 candidats sont requis').max(30, '30 candidats au plus'),
  })
  .superRefine((data, ctx) => {
    const start = parseInputValue(data.start);
    const end = parseInputValue(data.end);
    if (start && end && end <= start) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: "La clôture doit être après l'ouverture" });
    }
    if (end && end <= new Date()) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'La clôture ne peut pas être dans le passé' });
    }
    const names = data.candidates.map((c) => `${c.first_name} ${c.last_name}`.trim().toLowerCase());
    names.forEach((name, i) => {
      if (name.length > 1 && names.indexOf(name) !== i) {
        ctx.addIssue({ code: 'custom', path: ['candidates', i, 'last_name'], message: 'Ce candidat est déjà dans la liste' });
      }
    });
  });

export type ElectionFormValues = z.infer<typeof ElectionFormSchema>;
