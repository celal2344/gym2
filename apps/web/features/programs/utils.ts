import {
  trainingProgramContentSchema,
  type ProgramDay,
  type ProgramExercise,
  type ProgramWeek,
  type TrainingProgramContent,
} from "@repo/domain";

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createBlankExercise(): ProgramExercise {
  return {
    id: id("exercise"),
    exerciseName: "Goblet squat",
    targetMuscles: "legs, core",
    equipment: "dumbbell",
    sets: 3,
    reps: "8-10",
    restSeconds: 75,
    notes: "",
    visualCue: {
      setup: "Feet shoulder-width, weight close to the chest.",
      action: "Sit between the hips, then drive the floor away.",
      tempo: "Controlled down, strong up.",
      breathing: "Inhale before lowering, exhale after standing.",
      safety: "Keep knees tracking over toes and chest tall.",
      imageUrl: "",
      sourceName: "Free Exercise DB can be linked here",
      sourceUrl: "https://github.com/yuhonas/free-exercise-db",
    },
  };
}

export function createBlankDay(dayNumber = 1): ProgramDay {
  return {
    id: id("day"),
    title: `Day ${dayNumber}`,
    focus: "Full-body strength",
    exercises: [createBlankExercise()],
  };
}

export function createBlankWeek(weekNumber = 1): ProgramWeek {
  return {
    id: id("week"),
    title: `Week ${weekNumber}`,
    days: [createBlankDay(1)],
  };
}

export function createBlankProgramContent(): TrainingProgramContent {
  return {
    version: 1,
    sourceAttribution:
      "Visual cue fields may reference Free Exercise DB (Unlicense) or manually entered trainer guidance.",
    weeks: [createBlankWeek(1)],
  };
}

export function normalizeProgramContent(
  value: unknown,
): TrainingProgramContent {
  const parsed = trainingProgramContentSchema.parse(value ?? {});
  return {
    ...parsed,
    sourceAttribution:
      parsed.sourceAttribution || createBlankProgramContent().sourceAttribution,
    weeks: parsed.weeks.length ? parsed.weeks : [createBlankWeek(1)],
  };
}

export function getProgramStructureSummary(content: TrainingProgramContent) {
  const dayCount = content.weeks.reduce(
    (total, week) => total + week.days.length,
    0,
  );
  const exerciseCount = content.weeks.reduce(
    (weekTotal, week) =>
      weekTotal +
      week.days.reduce((dayTotal, day) => dayTotal + day.exercises.length, 0),
    0,
  );
  return `${content.weeks.length} weeks - ${dayCount} days - ${exerciseCount} exercises`;
}

export function cloneDay(day: ProgramDay, dayNumber: number): ProgramDay {
  return {
    ...day,
    id: id("day"),
    title: `${day.title} copy ${dayNumber}`,
    exercises: day.exercises.map((exercise) => ({
      ...exercise,
      id: id("exercise"),
    })),
  };
}
