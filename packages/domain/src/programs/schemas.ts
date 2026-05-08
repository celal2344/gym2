import { z } from "zod";

export const trainingProgramStatuses = ["draft", "active", "archived"] as const;
export const trainingProgramAssignmentStatuses = [
  "assigned",
  "active",
  "completed",
  "cancelled",
] as const;

const defaultProgramExerciseCue = {
  setup: "",
  action: "",
  tempo: "",
  breathing: "",
  safety: "",
  imageUrl: "",
  sourceName: "",
  sourceUrl: "",
};

export const programExerciseCueSchema = z.object({
  setup: z.string().default(""),
  action: z.string().default(""),
  tempo: z.string().default(""),
  breathing: z.string().default(""),
  safety: z.string().default(""),
  imageUrl: z
    .string()
    .url("forms.errors.programExerciseImage.url")
    .or(z.literal(""))
    .default(""),
  sourceName: z.string().default(""),
  sourceUrl: z
    .string()
    .url("forms.errors.programExerciseSource.url")
    .or(z.literal(""))
    .default(""),
});

export const programExerciseSchema = z.object({
  id: z.string().min(1),
  exerciseName: z
    .string()
    .min(2, "forms.errors.programExerciseName.min")
    .max(160, "forms.errors.programExerciseName.max"),
  targetMuscles: z
    .string()
    .max(160, "forms.errors.programExerciseTarget.max")
    .default(""),
  equipment: z
    .string()
    .max(120, "forms.errors.programExerciseEquipment.max")
    .default(""),
  sets: z
    .number()
    .int()
    .min(1, "forms.errors.programExerciseSets.min")
    .max(20, "forms.errors.programExerciseSets.max")
    .default(3),
  reps: z
    .string()
    .min(1, "forms.errors.programExerciseReps.required")
    .max(80, "forms.errors.programExerciseReps.max")
    .default("8-12"),
  restSeconds: z.number().int().min(0).max(600).default(60),
  notes: z.string().default(""),
  visualCue: programExerciseCueSchema.default(defaultProgramExerciseCue),
});

export const programDaySchema = z.object({
  id: z.string().min(1),
  title: z
    .string()
    .min(2, "forms.errors.programDayTitle.min")
    .max(120, "forms.errors.programDayTitle.max"),
  focus: z.string().max(160, "forms.errors.programDayFocus.max").default(""),
  exercises: z.array(programExerciseSchema).default([]),
});

export const programWeekSchema = z.object({
  id: z.string().min(1),
  title: z
    .string()
    .min(2, "forms.errors.programWeekTitle.min")
    .max(120, "forms.errors.programWeekTitle.max"),
  days: z.array(programDaySchema).default([]),
});

export const trainingProgramContentSchema = z
  .object({
    version: z.literal(1).default(1),
    sourceAttribution: z
      .string()
      .default(
        "Visual cue fields may reference Free Exercise DB (Unlicense) or manually entered trainer guidance.",
      ),
    weeks: z.array(programWeekSchema).default([]),
  })
  .passthrough()
  .default({ version: 1, sourceAttribution: "", weeks: [] });

export const trainingProgramSchema = z.object({
  id: z.string().uuid(),
  organization: z.string().uuid().optional(),
  title: z
    .string()
    .min(2, "forms.errors.programTitle.min")
    .max(160, "forms.errors.programTitle.max"),
  summary: z.string().default(""),
  goal: z.string().max(160, "forms.errors.programGoal.max").default(""),
  difficulty: z
    .string()
    .max(80, "forms.errors.programDifficulty.max")
    .default(""),
  status: z.enum(trainingProgramStatuses).default("draft"),
  createdBy: z.string().uuid().nullable().optional(),
  createdByName: z.string().default(""),
  content: trainingProgramContentSchema,
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

export const trainingProgramAssignmentCreateSchema =
  trainingProgramAssignmentSchema.omit({
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

export const memberTrainingProgramAssignmentSchema = z.object({
  id: z.string().uuid(),
  program: z.string().uuid(),
  programTitle: z.string().default(""),
  programSummary: z.string().default(""),
  programGoal: z.string().default(""),
  programDifficulty: z.string().default(""),
  programContent: trainingProgramContentSchema,
  assignedByName: z.string().default(""),
  status: z.enum(trainingProgramAssignmentStatuses).default("assigned"),
  startsOn: z.string().nullable().optional(),
  endsOn: z.string().nullable().optional(),
  notes: z.string().default(""),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type TrainingProgramStatus = (typeof trainingProgramStatuses)[number];
export type TrainingProgramAssignmentStatus =
  (typeof trainingProgramAssignmentStatuses)[number];
export type ProgramExerciseCue = z.infer<typeof programExerciseCueSchema>;
export type ProgramExercise = z.infer<typeof programExerciseSchema>;
export type ProgramDay = z.infer<typeof programDaySchema>;
export type ProgramWeek = z.infer<typeof programWeekSchema>;
export type TrainingProgramContent = z.infer<
  typeof trainingProgramContentSchema
>;
export type TrainingProgram = z.infer<typeof trainingProgramSchema>;
export type TrainingProgramInput = z.input<typeof trainingProgramCreateSchema>;
export type TrainingProgramCreate = z.infer<typeof trainingProgramCreateSchema>;
export type TrainingProgramAssignment = z.infer<
  typeof trainingProgramAssignmentSchema
>;
export type TrainingProgramAssignmentInput = z.input<
  typeof trainingProgramAssignmentCreateSchema
>;
export type TrainingProgramAssignmentCreate = z.infer<
  typeof trainingProgramAssignmentCreateSchema
>;
export type MemberTrainingProgramAssignment = z.infer<
  typeof memberTrainingProgramAssignmentSchema
>;
