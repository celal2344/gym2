"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import type { MemberTrainingProgramAssignment } from "@repo/domain";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMyProgramAssignments } from "@/lib/api/member";

function label(value: string) {
  return value.replaceAll("_", " ");
}

export function MemberProgramsPanel() {
  const [assignments, setAssignments] = useState<MemberTrainingProgramAssignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setAssignments(await listMyProgramAssignments());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load assigned programs.");
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
          <CardDescription>Assigned training programs from your trainer or operations team.</CardDescription>
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={isLoading}>
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
              <div key={assignment.id} className="rounded-md border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">{assignment.programTitle}</h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      {assignment.programGoal || assignment.programSummary || "Program details will be added by your trainer."}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {label(assignment.status)}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-zinc-600">
                  <div className="flex justify-between gap-3">
                    <span>Difficulty</span>
                    <span className="font-medium capitalize text-zinc-950">{assignment.programDifficulty || "-"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Trainer</span>
                    <span className="font-medium text-zinc-950">{assignment.assignedByName || "-"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Dates</span>
                    <span className="font-medium text-zinc-950">
                      {assignment.startsOn || "Open"} - {assignment.endsOn || "Open"}
                    </span>
                  </div>
                </div>
                {assignment.notes ? <p className="mt-4 text-sm text-zinc-600">{assignment.notes}</p> : null}
              </div>
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
