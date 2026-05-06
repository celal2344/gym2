import { z } from "zod";

import { appRoles } from "./roles";

export const authPanels = ["admin", "manager", "trainer", "profile", "app"] as const;

export const authProfileSchema = z.object({
  id: z.string().uuid(),
  supabaseUserId: z.string().uuid().nullable(),
  fullName: z.string().min(1),
  email: z.string().default(""),
  phone: z.string().default(""),
});

export const authOrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});

export const authStaffMemberSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  roleKind: z.string(),
  jobTitle: z.string().default(""),
});

export const authCustomerSchema = z.object({
  id: z.string().uuid(),
  membershipCode: z.string(),
  status: z.string(),
});

export const authSessionSchema = z.object({
  profile: authProfileSchema,
  organization: authOrganizationSchema.nullable(),
  role: z.enum(appRoles).or(z.literal("front_desk")).or(z.literal("therapist")).or(z.literal("anonymous")),
  staffMember: authStaffMemberSchema.nullable(),
  customer: authCustomerSchema.nullable(),
  allowedPanels: z.array(z.enum(authPanels)),
});

export type AuthPanel = (typeof authPanels)[number];
export type AuthSession = z.infer<typeof authSessionSchema>;
