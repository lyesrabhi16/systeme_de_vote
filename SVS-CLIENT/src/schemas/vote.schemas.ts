import { type CandidateCreateModel } from "@api/sdk/api";

import z from "zod";

export const VoteFormSchema = z.object({
    id: z.number().optional(),
    title: z.string().min(1, "Le titre est requis"),
    description: z.string().min(1, "La description est requise"),
    start_date: z.date({ message: "La date de début est requise" }),
    end_date: z.date({ message: "La date de fin est requise" }),
    candidates: z.array(z.object<CandidateCreateModel>().loose()).min(2, "Au moins 2 candidats sont requis"),
    open_to_all: z.boolean(),
    attributed_user_ids: z.array(z.number()).default(<number[]>[]),
    excluded_user_ids: z.array(z.number()).default(<number[]>[])
});