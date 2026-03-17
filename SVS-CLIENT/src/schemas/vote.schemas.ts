
import z from "zod";

const CandidateSchema = z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    photo_url: z.string().nullable().optional(),
    vote_id: z.number().optional(),
});
export const VoteFormSchema = z.object({
    id: z.number().optional(),
    title: z.string().min(1, "Le titre est requis"),
    description: z.string().min(1, "La description est requise"),
    start_date: z.date().refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
        message: "La date de début ne peut pas être dans le passé",
    }),
    end_date: z.date().refine((date) => date > new Date(), {
        message: "La date de fin ne peut pas être dans le passé",
    }),
    candidates: z.array(CandidateSchema).min(2, "Au moins 2 candidats sont requis"),
    open_to_all: z.boolean(),
    attributed_user_ids: z.array(z.number()).default([]),
    excluded_user_ids: z.array(z.number()).default([])
})
    .refine((data) => data.end_date > data.start_date, {
        message: "La date de fin doit être après la date de début",
        path: ["end_date"], // This attaches the error specifically to the end_date field
    });