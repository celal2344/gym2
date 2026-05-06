import { z } from "zod";

export const moneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.string().length(3).default("TRY"),
});
