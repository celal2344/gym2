import { z } from "zod";

export const trainingProgramStatuses = ["draft", "active", "archived"] as const;
export const trainingProgramAssignmentStatuses = ["assigned", "active", "completed", "cancelled"] as const;

export const trainingProgramSchema = z.object({
  id: z.string().uuid(),
  organization: z.string().uuid().optional(),
  title: z.string().min(2, "forms.errors.programTitle.min").max(160, "forms.errors.programTitle.max"),
  summary: z.string().default(""),
  goal: z.string().max(160, "forms.errors.programGoal.max").default(""),
  difficulty: z.string().max(80, "forms.errors.programDifficulty.max").default(""),
  status: z.enum(trainingProgramStatuses).default("draft"),
  createdBy: z.string().uuid().nullable().optional(),
  createdByName: z.string().default(""),
  content: z.record(z.string(), z.unknown()).default({}),
  isActive: z.boolean().default(true),
  assignmentCount: z.number().int().min(0).default(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const trainingProgramCreateSchema = trainingProgramSchema.omit({
  id: true,
  organization: true,
  createdBy: true,
  createdByName: true,
  assignmentCount: true,
  createdAt: true,
  updatedAt: true,
});

export const trainingProgramAssignmentSchema = z.object({
  id: z.string().uuid(),
  organization: z.string().uuid().optional(),
  program: z.string().uuid(),
  programTitle: z.string().default(""),
  customer: z.string().uuid(),
  customerName: z.string().default(""),
  customerMembershipCode: z.string().default(""),
  assignedBy: z.string().uuid().nullable().optional(),
  assignedByName: z.string().default(""),
  status: z.enum(trainingProgramAssignmentStatuses).default("assigned"),
  startsOn: z.string().nullable().optional(),
  endsOn: z.string().nullable().optional(),
  notes: z.string().default(""),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const trainingProgramAssignmentCreateSchema = trainingProgramAssignmentSchema.omit({
  id: true,
  organization: true,
  programTitle: true,
  customerName: true,
  customerMembershipCode: true,
  assignedBy: true,
  assignedByName: true,
  createdAt: true,
  updatedAt: true,
});

export type TrainingProgramStatus = (typeof trainingProgramStatuses)[number];
export type TrainingProgramAssignmentStatus = (typeof trainingProgramAssignmentStatuses)[number];
export type TrainingProgram = z.infer<typeof trainingProgramSchema>;
export type TrainingProgramInput = z.input<typeof trainingProgramCreateSchema>;
export type TrainingProgramCreate = z.infer<typeof trainingProgramCreateSchema>;
export type TrainingProgramAssignment = z.infer<typeof trainingProgramAssignmentSchema>;
export type TrainingProgramAssignmentInput = z.input<typeof trainingProgramAssignmentCreateSchema>;
export type TrainingProgramAssignmentCreate = z.infer<typeof trainingProgramAssignmentCreateSchema>;
