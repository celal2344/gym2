import { z } from "zod";

export const trainingSessionKinds = [
  "personal_training",
  "yoga",
  "swimming_lesson",
  "boxing",
  "pilates",
  "rehab",
  "other",
] as const;

export const trainingSessionPlanStatuses = ["draft", "active", "paused", "completed", "cancelled"] as const;
export const trainingSessionPaymentStatuses = ["unpaid", "partial", "paid", "refunded", "external_pending"] as const;
export const trainingSessionOccurrenceStatuses = ["scheduled", "completed", "cancelled", "no_show", "rescheduled"] as const;

export const trainingSessionPlanSchema = z.object({
  id: z.string().uuid(),
  organization: z.string().uuid().optional(),
  customer: z.string().uuid(),
  customerName: z.string().default(""),
  trainer: z.string().uuid(),
  trainerName: z.string().default(""),
  title: z.string().min(2).max(160),
  sessionKind: z.enum(trainingSessionKinds),
  status: z.enum(trainingSessionPlanStatuses).default("active"),
  paymentStatus: z.enum(trainingSessionPaymentStatuses).default("external_pending"),
  paymentAmount: z.number().int().min(0).default(0),
  amountPaid: z.number().int().min(0).default(0),
  amountDue: z.number().int().min(0).default(0),
  paymentCurrency: z.string().length(3).default("TRY"),
  paymentProvider: z.string().max(80).default(""),
  externalPaymentReference: z.string().max(160).default(""),
  paidAt: z.string().datetime().nullable().optional(),
  paymentNotes: z.string().default(""),
  totalSessions: z.number().int().min(1).max(500),
  defaultDurationMin: z.number().int().min(1).max(1440),
  startsOn: z.string().nullable().optional(),
  endsOn: z.string().nullable().optional(),
  details: z.string().default(""),
  isActive: z.boolean().default(true),
  scheduledCount: z.number().int().min(0).default(0),
  completedCount: z.number().int().min(0).default(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const trainingSessionPlanCreateSchema = trainingSessionPlanSchema.omit({
  id: true,
  organization: true,
  customerName: true,
  trainerName: true,
  amountDue: true,
  scheduledCount: true,
  completedCount: true,
  createdAt: true,
  updatedAt: true,
});

export const trainingSessionOccurrenceSchema = z.object({
  id: z.string().uuid(),
  plan: z.string().uuid(),
  planTitle: z.string().default(""),
  sessionKind: z.enum(trainingSessionKinds),
  customer: z.string().uuid(),
  customerName: z.string().default(""),
  trainer: z.string().uuid(),
  trainerName: z.string().default(""),
  sequenceNumber: z.number().int().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: z.enum(trainingSessionOccurrenceStatuses).default("scheduled"),
  locationName: z.string().max(160).default(""),
  notes: z.string().default(""),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const trainingSessionOccurrenceCreateSchema = trainingSessionOccurrenceSchema.omit({
  id: true,
  planTitle: true,
  sessionKind: true,
  customer: true,
  customerName: true,
  trainer: true,
  trainerName: true,
  createdAt: true,
  updatedAt: true,
});

export const generateTrainingSessionOccurrencesSchema = z.object({
  startDate: z.string(),
  startTime: z.string(),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  count: z.number().int().min(1).max(100).optional(),
  durationMin: z.number().int().min(1).max(1440).optional(),
  locationName: z.string().max(160).default(""),
  notes: z.string().default(""),
});

export type TrainingSessionKind = (typeof trainingSessionKinds)[number];
export type TrainingSessionPlanStatus = (typeof trainingSessionPlanStatuses)[number];
export type TrainingSessionPaymentStatus = (typeof trainingSessionPaymentStatuses)[number];
export type TrainingSessionOccurrenceStatus = (typeof trainingSessionOccurrenceStatuses)[number];
export type TrainingSessionPlan = z.infer<typeof trainingSessionPlanSchema>;
export type TrainingSessionPlanCreate = z.infer<typeof trainingSessionPlanCreateSchema>;
export type TrainingSessionOccurrence = z.infer<typeof trainingSessionOccurrenceSchema>;
export type TrainingSessionOccurrenceCreate = z.infer<typeof trainingSessionOccurrenceCreateSchema>;
export type GenerateTrainingSessionOccurrences = z.infer<typeof generateTrainingSessionOccurrencesSchema>;
