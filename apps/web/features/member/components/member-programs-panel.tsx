"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Dumbbell, RefreshCw } from "lucide-react";
import type { MemberTrainingProgramAssignment } from "@repo/domain";

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
import { listMyProgramAssignments } from "@/lib/api/member";

function label(value: string) {
  return value.replaceAll("_", " ");
}

function programStructure(assignment: MemberTrainingProgramAssignment) {
  const content = assignment.programContent;
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
  const firstExercises = content.weeks
    .flatMap((week) => week.days)
    .flatMap((day) => day.exercises)
    .slice(0, 3);
  return {
    summary: `${content.weeks.length} weeks - ${dayCount} days - ${exerciseCount} exercises`,
    firstExercises,
  };
}

export function MemberProgramsPanel() {
  const [assignments, setAssignments] = useState<
    MemberTrainingProgramAssignment[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setAssignments(await listMyProgramAssignments());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load assigned programs.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status !== "cancelled"),
    [assignments],
  );

  return (
    <Card className="rounded-md border-zinc-200 shadow-none">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5 text-cyan-800" />
            My programs
          </CardTitle>
          <CardDescription>
            Assigned training programs from your trainer or operations team.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          onClick={() => void refresh()}
          disabled={isLoading}
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Member API unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {activeAssignments.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {activeAssignments.map((assignment) => (
              <MemberProgramCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
            {isLoading ? "Loading..." : "No assigned programs yet."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MemberProgramCard({
  assignment,
}: {
  assignment: MemberTrainingProgramAssignment;
}) {
  const structure = programStructure(assignment);

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{assignment.programTitle}</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {assignment.programGoal ||
              assignment.programSummary ||
              "Program details will be added by your trainer."}
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {label(assignment.status)}
        </Badge>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-zinc-600">
        <div className="flex justify-between gap-3">
          <span>Difficulty</span>
          <span className="font-medium capitalize text-zinc-950">
            {assignment.programDifficulty || "-"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Trainer</span>
          <span className="font-medium text-zinc-950">
            {assignment.assignedByName || "-"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Dates</span>
          <span className="font-medium text-zinc-950">
            {assignment.startsOn || "Open"} - {assignment.endsOn || "Open"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Structure</span>
          <span className="font-medium text-zinc-950">{structure.summary}</span>
        </div>
      </div>

      {structure.firstExercises.length ? (
        <div className="mt-4 space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          {structure.firstExercises.map((exercise) => (
            <div key={exercise.id} className="flex gap-2 text-sm">
              <Dumbbell className="mt-0.5 size-4 shrink-0 text-cyan-800" />
              <div>
                <div className="font-medium text-zinc-950">
                  {exercise.exerciseName}
                </div>
                <div className="text-xs text-zinc-600">
                  {exercise.sets} sets - {exercise.reps} -{" "}
                  {exercise.visualCue.action || exercise.visualCue.setup}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {assignment.notes ? (
        <p className="mt-4 text-sm text-zinc-600">{assignment.notes}</p>
      ) : null}
    </div>
  );
}
