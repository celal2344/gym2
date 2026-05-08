"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  ArrowLeft,
  Copy,
  Dumbbell,
  Eye,
  Plus,
  Save,
  Send,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  trainingProgramCreateSchema,
  type ProgramDay,
  type ProgramExercise,
  type TrainingProgram,
  type TrainingProgramContent,
  type TrainingProgramInput,
} from "@repo/domain";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createTrainingProgram,
  updateTrainingProgram,
} from "@/lib/api/programs";
import {
  cloneDay,
  createBlankDay,
  createBlankExercise,
  createBlankProgramContent,
  createBlankWeek,
  getProgramStructureSummary,
  normalizeProgramContent,
} from "../utils";
import { ExerciseInspector } from "./exercise-inspector";
import { ProgramBuilderSidebar } from "./program-builder-sidebar";

type ProgramBuilderShellProps = {
  program: TrainingProgram | null;
  onCancel: () => void;
  onSaved: () => Promise<void> | void;
};

const blankProgram: TrainingProgramInput = {
  title: "",
  summary: "",
  goal: "",
  difficulty: "beginner",
  status: "draft",
  content: createBlankProgramContent(),
  isActive: true,
};

function programToForm(program: TrainingProgram | null): TrainingProgramInput {
  if (!program) {
    return { ...blankProgram, content: createBlankProgramContent() };
  }
  return {
    title: program.title,
    summary: program.summary,
    goal: program.goal,
    difficulty: program.difficulty,
    status: program.status,
    content: normalizeProgramContent(program.content),
    isActive: program.isActive,
  };
}

function exerciseCueSummary(exercise: ProgramExercise) {
  return (
    exercise.visualCue.action ||
    exercise.visualCue.setup ||
    exercise.notes ||
    "Add a short coaching cue."
  );
}

export function ProgramBuilderShell({
  program,
  onCancel,
  onSaved,
}: ProgramBuilderShellProps) {
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedLabel, setSavedLabel] = useState("");

  const form = useForm<TrainingProgramInput>({
    resolver: zodResolver(trainingProgramCreateSchema),
    defaultValues: programToForm(program),
    mode: "onBlur",
  });

  const content = normalizeProgramContent(form.watch("content"));
  const activeWeek =
    content.weeks[Math.min(activeWeekIndex, content.weeks.length - 1)];
  const activeDay =
    activeWeek?.days[Math.min(activeDayIndex, activeWeek.days.length - 1)];
  const activeExercise =
    activeDay?.exercises.find((exercise) => exercise.id === activeExerciseId) ??
    activeDay?.exercises[0] ??
    null;
  const structureSummary = useMemo(
    () => getProgramStructureSummary(content),
    [content],
  );

  function setContent(next: TrainingProgramContent) {
    form.setValue("content", next, { shouldDirty: true, shouldValidate: true });
    setSavedLabel("");
  }

  function updateContent(
    mutator: (draft: TrainingProgramContent) => TrainingProgramContent,
  ) {
    setContent(mutator(normalizeProgramContent(form.getValues("content"))));
  }

  function updateDay(day: ProgramDay) {
    updateContent((draft) => ({
      ...draft,
      weeks: draft.weeks.map((week, weekIndex) =>
        weekIndex === activeWeekIndex
          ? {
              ...week,
              days: week.days.map((item, dayIndex) =>
                dayIndex === activeDayIndex ? day : item,
              ),
            }
          : week,
      ),
    }));
  }

  function updateExercise(exercise: ProgramExercise) {
    if (!activeDay) {
      return;
    }
    updateDay({
      ...activeDay,
      exercises: activeDay.exercises.map((item) =>
        item.id === exercise.id ? exercise : item,
      ),
    });
  }

  function addWeek() {
    updateContent((draft) => {
      const nextWeek = createBlankWeek(draft.weeks.length + 1);
      setActiveWeekIndex(draft.weeks.length);
      setActiveDayIndex(0);
      setActiveExerciseId(nextWeek.days[0]?.exercises[0]?.id ?? null);
      return { ...draft, weeks: [...draft.weeks, nextWeek] };
    });
  }

  function addDay() {
    updateContent((draft) => ({
      ...draft,
      weeks: draft.weeks.map((week, index) => {
        if (index !== activeWeekIndex) {
          return week;
        }
        const nextDay = createBlankDay(week.days.length + 1);
        setActiveDayIndex(week.days.length);
        setActiveExerciseId(nextDay.exercises[0]?.id ?? null);
        return { ...week, days: [...week.days, nextDay] };
      }),
    }));
  }

  function duplicateActiveDay() {
    if (!activeDay || !activeWeek) {
      return;
    }
    updateContent((draft) => ({
      ...draft,
      weeks: draft.weeks.map((week, index) =>
        index === activeWeekIndex
          ? {
              ...week,
              days: [
                ...week.days,
                cloneDay(activeDay, activeWeek.days.length + 1),
              ],
            }
          : week,
      ),
    }));
  }

  function addExercise() {
    if (!activeDay) {
      return;
    }
    const exercise = createBlankExercise();
    updateDay({ ...activeDay, exercises: [...activeDay.exercises, exercise] });
    setActiveExerciseId(exercise.id);
  }

  function removeExercise(exerciseId: string) {
    if (!activeDay) {
      return;
    }
    const nextExercises = activeDay.exercises.filter(
      (exercise) => exercise.id !== exerciseId,
    );
    updateDay({ ...activeDay, exercises: nextExercises });
    setActiveExerciseId(nextExercises[0]?.id ?? null);
  }

  async function save(
    values: TrainingProgramInput,
    statusOverride?: TrainingProgramInput["status"],
  ) {
    setError(null);
    setIsSaving(true);
    try {
      const payload = trainingProgramCreateSchema.parse({
        ...values,
        status: statusOverride ?? values.status,
        content: normalizeProgramContent(values.content),
      });
      const isNewProgram = !program;
      if (program) {
        await updateTrainingProgram(program.id, payload);
      } else {
        await createTrainingProgram(payload);
      }
      setSavedLabel("Saved just now");
      await onSaved();
      if (isNewProgram) {
        onCancel();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save program.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => save(values))}
      noValidate
    >
      <div className="sticky top-0 z-20 -mx-4 border-b border-zinc-200 bg-[#f6f4ef]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              <ArrowLeft className="size-4" />
              Back to programs
            </Button>
            <div>
              <h2 className="text-xl font-semibold">
                {program ? "Edit program" : "Create program"}
              </h2>
              <p className="text-sm text-zinc-500">{structureSummary}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {savedLabel ? (
              <span className="text-sm text-emerald-700">{savedLabel}</span>
            ) : null}
            <Badge variant="secondary">{form.watch("status")}</Badge>
            <Button type="submit" variant="outline" disabled={isSaving}>
              <Save className="size-4" />
              Save draft
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => save(form.getValues(), "active")}
            >
              <Send className="size-4" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Program save failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(480px,1fr)_360px] 2xl:grid-cols-[300px_minmax(560px,1fr)_400px]">
        <ProgramBuilderSidebar
          form={form}
          content={content}
          activeWeekIndex={activeWeekIndex}
          onAddWeek={addWeek}
          onSelectWeek={(index) => {
            const week = content.weeks[index];
            setActiveWeekIndex(index);
            setActiveDayIndex(0);
            setActiveExerciseId(week?.days[0]?.exercises[0]?.id ?? null);
          }}
        />

        <Card className="min-w-0 rounded-md border-zinc-200 shadow-none">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>{activeWeek?.title ?? "Week"}</CardTitle>
                <CardDescription>
                  Edit days and exercise prescriptions.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDay}
                >
                  <Plus className="size-3" />
                  Day
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={duplicateActiveDay}
                  disabled={!activeDay}
                >
                  <Copy className="size-3" />
                  Duplicate day
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeWeek ? (
              <Field>
                <FieldLabel>Week title</FieldLabel>
                <Input
                  aria-label="Week title"
                  value={activeWeek.title}
                  onChange={(event) =>
                    updateContent((draft) => ({
                      ...draft,
                      weeks: draft.weeks.map((week, index) =>
                        index === activeWeekIndex
                          ? { ...week, title: event.target.value }
                          : week,
                      ),
                    }))
                  }
                />
              </Field>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {activeWeek?.days.map((day, index) => (
                <Button
                  type="button"
                  key={day.id}
                  variant={index === activeDayIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setActiveDayIndex(index);
                    setActiveExerciseId(day.exercises[0]?.id ?? null);
                  }}
                >
                  {day.title}
                </Button>
              ))}
            </div>

            {activeDay ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Field>
                  <FieldLabel>Day title</FieldLabel>
                  <Input
                    aria-label="Day title"
                    value={activeDay.title}
                    onChange={(event) =>
                      updateDay({ ...activeDay, title: event.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Focus</FieldLabel>
                  <Input
                    aria-label="Day focus"
                    value={activeDay.focus}
                    onChange={(event) =>
                      updateDay({ ...activeDay, focus: event.target.value })
                    }
                  />
                </Field>
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Exercises</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExercise}
              >
                <Plus className="size-3" />
                Exercise
              </Button>
            </div>

            <div className="space-y-3">
              {activeDay?.exercises.length ? (
                activeDay.exercises.map((exercise) => (
                  <button
                    type="button"
                    key={exercise.id}
                    className={`w-full rounded-md border p-3 text-left transition ${
                      activeExercise?.id === exercise.id
                        ? "border-cyan-800 bg-cyan-50"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                    onClick={() => setActiveExerciseId(exercise.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-cyan-800">
                        <Dumbbell className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {exercise.exerciseName}
                          </span>
                          <Badge variant="secondary">
                            {exercise.sets} sets
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {exercise.reps} - {exercise.restSeconds}s rest -{" "}
                          {exercise.equipment || "no equipment"}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                          {exerciseCueSummary(exercise)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center">
                  <Activity className="mx-auto size-8 text-zinc-400" />
                  <p className="mt-2 text-sm text-zinc-500">
                    No exercises yet.
                  </p>
                  <Button type="button" className="mt-3" onClick={addExercise}>
                    <Plus className="size-4" />
                    Add exercise
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 rounded-md border-zinc-200 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="size-4 text-cyan-800" />
              Exercise cues
            </CardTitle>
            <CardDescription>
              Simple form guidance for the selected exercise.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeExercise ? (
              <ExerciseInspector
                exercise={activeExercise}
                onChange={updateExercise}
                onDelete={() => removeExercise(activeExercise.id)}
              />
            ) : (
              <p className="text-sm text-zinc-500">
                Select or add an exercise to edit cues.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
