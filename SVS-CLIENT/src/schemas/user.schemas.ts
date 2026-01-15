import z from "zod";

export const passwordSchema = z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
    .regex(/[A-Z]/, { message: "Le mot de passe doit contenir au moins une lettre majuscule" })
    .regex(/[a-z]/, { message: "Le mot de passe doit contenir au moins une lettre minuscule" })
    .regex(/[0-9]/, { message: "Le mot de passe doit contenir au moins un chiffre" })
    .regex(/[^A-Za-z0-9]/, { message: "Le mot de passe doit contenir au moins un caractère spécial" });
export const UserFormSchema = z.object({
    id: z.number().optional(),
    username: z.string().min(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caractères" }),
    email: z.email({ message: "Adresse e-mail invalide" }),
    verified_email: z.boolean().optional(),
    first_name: z.string().min(1, { message: "Le prénom est requis" }),
    last_name: z.string().min(1, { message: "Le nom de famille est requis" }),
    is_active: z.boolean().optional(),
    phone_number: z.string().min(10, { message: "Le numéro de téléphone doit contenir au moins 10 chiffres" }),
    verified_phone_number: z.boolean().optional(),
    is_admin: z.boolean().optional(),
});