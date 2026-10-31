
import { z } from 'zod';


export const LoginFormSchema = z.object({
    email: z.email({ message: 'Adresse email invalide' }),
    // optional: an account an administrator has just made has no password, and signs in with the one-time password alone.
    // The field holds '' when it is empty (a field that starts undefined is uncontrolled until it is typed in); the form sends nothing then.
    password: z.string().optional(),
    remember_me: z.boolean().optional(),
});
export type LoginFormSchemaType = z.infer<typeof LoginFormSchema>;

export const EmailSchema = z.object({
    email: z.email('Adresse e-mail invalide'),
});

export type EmailSchemaType = z.infer<typeof EmailSchema>;

export const PasswordSchema = z.string().min(8, { error: "minimum 8 caractères" });
export const PasswordResetSchema = z.object({
    password1: PasswordSchema,
    password2: PasswordSchema,
}).refine((data) => {
    //console.log('data in refine: ', data, data.password1, data.password2);
    return data.password1 === data.password2
}, {
    message: "Les mots de passe ne correspondent pas",
    path: ["password2"],
});

export type PasswordResetSchemaType = z.infer<typeof PasswordResetSchema>;