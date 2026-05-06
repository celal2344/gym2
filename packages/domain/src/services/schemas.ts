import { z } from "zod";

import { moneySchema } from "../common/money";

export const serviceKinds = ["pool", "personal_training", "massage", "day_pass"] as const;
export const capacityModes = ["shared_capacity", "staff_exclusive", "staff_and_resource", "entitlement"] as const;
export const resourceKinds = ["pool_lane", "room", "entry_gate"] as const;

export const serviceSchema = z.object({
  id: z.string().uuid(),
  locationId: z.string().uuid(),
  name: z.string().min(2),
  kind: z.enum(serviceKinds),
  durationMin: z.number().int().positive(),
  slotIntervalMin: z.number().int().positive(),
  capacityMode: z.enum(capacityModes),
  requiresStaff: z.boolean(),
  requiresResource: z.boolean(),
  basePrice: moneySchema.optional(),
});

export const slotSchema = z.object({
  id: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().nullable(),
  resourceId: z.string().uuid().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  capacityTotal: z.number().int().positive(),
  capacityReserved: z.number().int().nonnegative(),
});

export type ServiceKind = (typeof serviceKinds)[number];
export type CapacityMode = (typeof capacityModes)[number];
export type Service = z.infer<typeof serviceSchema>;
export type Slot = z.infer<typeof slotSchema>;
