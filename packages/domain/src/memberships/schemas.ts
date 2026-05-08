import { z } from "zod";

export const membershipProductKinds = ["membership", "credit_pack", "day_pass"] as const;
export const membershipBillingCycles = ["monthly", "annual", "session_pack", "one_time"] as const;
export const membershipAccessRules = ["unlimited", "limited_visits", "classes_only", "appointments_only"] as const;
export const membershipStatuses = ["trial", "active", "frozen", "cancelled", "expired"] as const;
export const memberCheckInMethods = ["qr", "membership_code", "manual", "kiosk"] as const;
export const memberCheckInSources = ["front_desk", "member_app", "kiosk", "import"] as const;

export const membershipPlanSchema = z.object({
  id: z.string().uuid(),
  organization: z.string().uuid().optional(),
  name: z.string().min(2, "forms.errors.membershipPlanName.min").max(160, "forms.errors.membershipPlanName.max"),
  productKind: z.enum(membershipProductKinds).default("membership"),
  billingCycle: z.enum(membershipBillingCycles).default("monthly"),
  accessRule: z.enum(membershipAccessRules).default("unlimited"),
  visitLimitPerPeriod: z.number().int().min(0).nullable().optional(),
  sessionCreditAmount: z.number().int().min(0).default(0),
  priceAmount: z.number().int().min(0).default(0),
  priceCurrency: z.string().length(3, "forms.errors.currency.length").default("TRY"),
  isActive: z.boolean().default(true),
  activeMembershipCount: z.number().int().min(0).default(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const membershipPlanCreateSchema = membershipPlanSchema.omit({
  id: true,
  organization: true,
  activeMembershipCount: true,
  createdAt: true,
  updatedAt: true,
});

export const membershipSchema = z.object({
  id: z.string().uuid(),
  customer: z.string().uuid(),
  customerName: z.string().default(""),
  customerMembershipCode: z.string().default(""),
  plan: z.string().uuid().nullable().optional(),
  planName: z.string().default(""),
  productKind: z.enum(membershipProductKinds).default("membership"),
  status: z.enum(membershipStatuses).default("active"),
  validFrom: z.string().min(1, "forms.errors.validFrom.required"),
  validTo: z.string().nullable().optional(),
  remainingCredits: z.number().int().min(0).default(0),
  autoRenew: z.boolean().default(false),
  frozenAt: z.string().datetime().nullable().optional(),
  cancelledAt: z.string().datetime().nullable().optional(),
  cancellationReason: z.string().default(""),
  externalPaymentReference: z.string().max(160, "forms.errors.externalReference.max").default(""),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const membershipCreateSchema = membershipSchema.omit({
  id: true,
  customerName: true,
  customerMembershipCode: true,
  planName: true,
  frozenAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
});

export const memberCheckInSchema = z.object({
  id: z.string().uuid(),
  organization: z.string().uuid().optional(),
  customer: z.string().uuid(),
  customerName: z.string().default(""),
  customerMembershipCode: z.string().default(""),
  membership: z.string().uuid().nullable().optional(),
  membershipStatus: z.string().default(""),
  planName: z.string().default(""),
  method: z.enum(memberCheckInMethods).default("membership_code"),
  source: z.enum(memberCheckInSources).default("front_desk"),
  checkedInAt: z.string().datetime().optional(),
  handledBy: z.string().uuid().nullable().optional(),
  handledByName: z.string().default(""),
  notes: z.string().default(""),
  isVoided: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const memberCheckInCreateSchema = memberCheckInSchema.omit({
  id: true,
  organization: true,
  customerName: true,
  customerMembershipCode: true,
  membershipStatus: true,
  planName: true,
  handledBy: true,
  handledByName: true,
  createdAt: true,
  updatedAt: true,
});

export const checkInSummarySchema = z.object({
  todayCheckIns: z.number().int().min(0).default(0),
  manualCheckIns: z.number().int().min(0).default(0),
  membershipCodeCheckIns: z.number().int().min(0).default(0),
});

export type MembershipProductKind = (typeof membershipProductKinds)[number];
export type MembershipBillingCycle = (typeof membershipBillingCycles)[number];
export type MembershipAccessRule = (typeof membershipAccessRules)[number];
export type MembershipStatus = (typeof membershipStatuses)[number];
export type MemberCheckInMethod = (typeof memberCheckInMethods)[number];
export type MembershipPlan = z.infer<typeof membershipPlanSchema>;
export type MembershipPlanCreate = z.infer<typeof membershipPlanCreateSchema>;
export type MembershipPlanInput = z.input<typeof membershipPlanCreateSchema>;
export type Membership = z.infer<typeof membershipSchema>;
export type MembershipCreate = z.infer<typeof membershipCreateSchema>;
export type MembershipInput = z.input<typeof membershipCreateSchema>;
export type MemberCheckIn = z.infer<typeof memberCheckInSchema>;
export type MemberCheckInCreate = z.infer<typeof memberCheckInCreateSchema>;
export type MemberCheckInInput = z.input<typeof memberCheckInCreateSchema>;
export type CheckInSummary = z.infer<typeof checkInSummarySchema>;
