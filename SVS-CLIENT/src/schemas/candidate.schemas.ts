import z from "zod";

export const CandidateFormSchema = z.object({
    vote_id: z.number().optional(),
    first_name: z.string().min(1, { message: "Le prénom est requis" }),
    last_name: z.string().min(1, { message: "Le nom de famille est requis" }),
    photo_url: z.string().url({ message: "URL de la photo invalide" }).optional(),
});