import { z } from "zod";

import { profileInputSchema } from "./profile";

export const customerStatuses = ["active", "guest", "suspended"] as const;

export const customerSchema = profileInputSchema.extend({
  id: z.string().uuid(),
  profileId: z.string().uuid().nullable().optional(),
  membershipCode: z.string().min(1, "forms.errors.membershipCode.required").max(40, "forms.errors.membershipCode.max"),
  status: z.enum(customerStatuses).default("active"),
  notes: z.string().default(""),
  isActive: z.boolean().default(true),
  deactivatedAt: z.string().datetime().nullable().optional(),
});

export const customerCreateSchema = customerSchema.omit({
  id: true,
  profileId: true,
  deactivatedAt: true,
});

export const customerFormSchema = customerCreateSchema;

export const customerUpdateSchema = customerCreateSchema.partial();

export type CustomerStatus = (typeof customerStatuses)[number];
export type CustomerRecord = z.infer<typeof customerSchema>;
export type CustomerCreate = z.infer<typeof customerCreateSchema>;
export type CustomerFormInput = z.input<typeof customerFormSchema>;
export type CustomerFormValues = z.infer<typeof customerFormSchema>;
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>;
