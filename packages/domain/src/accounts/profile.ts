import { z } from "zod";

export const profileInputSchema = z.object({
  supabaseUserId: z.string().uuid().nullable().optional(),
  fullName: z.string().min(2, "forms.errors.fullName.min"),
  email: z.string().email("forms.errors.email.invalid").or(z.literal("")).default(""),
  phone: z.string().max(40, "forms.errors.phone.max").default(""),
});
