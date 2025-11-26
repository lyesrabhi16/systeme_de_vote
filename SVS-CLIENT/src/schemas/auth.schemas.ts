
import { z } from 'zod';


export const LoginFormSchema = z.object({
    email: z.email({ message: 'Adresse email invalide' }),
    password: z.string().min(1, { message: 'Mot de passe requis' }),
    remember_me: z.boolean().optional(),
});
export type LoginFormSchemaType = z.infer<typeof LoginFormSchema>;

