import { z } from "zod";

import { staffRoles } from "../auth/roles";
import { profileInputSchema } from "./profile";

export const employmentStatuses = ["active", "on_leave", "terminated"] as const;

export const employeeSchema = profileInputSchema.extend({
  id: z.string().uuid(),
  profileId: z.string().uuid().nullable().optional(),
  displayName: z.string().min(2, "forms.errors.displayName.min"),
  roleKind: z.enum(staffRoles),
  jobTitle: z.string().max(120, "forms.errors.jobTitle.max").default(""),
  employmentStatus: z.enum(employmentStatuses).default("active"),
  startsOn: z.string().nullable().optional(),
  emergencyContactName: z.string().max(160, "forms.errors.emergencyContactName.max").default(""),
  emergencyContactPhone: z.string().max(40, "forms.errors.emergencyContactPhone.max").default(""),
  notes: z.string().default(""),
  isActive: z.boolean().default(true),
  deactivatedAt: z.string().datetime().nullable().optional(),
});

export const employeeCreateSchema = employeeSchema.omit({
  id: true,
  profileId: true,
  deactivatedAt: true,
});

export const employeeFormSchema = employeeCreateSchema.extend({
  displayName: z.string().default(""),
});

export const employeeUpdateSchema = employeeCreateSchema.partial();

export type EmploymentStatus = (typeof employmentStatuses)[number];
export type Employee = z.infer<typeof employeeSchema>;
export type EmployeeCreate = z.infer<typeof employeeCreateSchema>;
export type EmployeeFormInput = z.input<typeof employeeFormSchema>;
export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
export type EmployeeUpdate = z.infer<typeof employeeUpdateSchema>;
