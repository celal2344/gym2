"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, Pencil, RefreshCw, Send, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  trainingProgramAssignmentCreateSchema,
  trainingProgramCreateSchema,
  type CustomerRecord,
  type TrainingProgram,
  type TrainingProgramAssignment,
  type TrainingProgramAssignmentInput,
  type TrainingProgramInput,
} from "@repo/domain";

import { DataTable } from "@/components/data/data-table";
import { SelectFormField, TextareaFormField, TextFormField } from "@/components/forms/rhf-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  cancelTrainingProgramAssignment,
  createTrainingProgramAssignment,
  listTrainingProgramAssignments,
  listTrainingPrograms,
  updateTrainingProgram,
  updateTrainingProgramAssignment,
} from "@/lib/api/programs";
import { programAssignmentStatusOptions, programStatusOptions } from "../constants";

const blankProgram: TrainingProgramInput = {
  title: "",
  summary: "",
  goal: "",
  difficulty: "",
  status: "draft",
  content: {},
  isActive: true,
};

const blankAssignment: TrainingProgramAssignmentInput = {
  program: "",
  customer: "",
  status: "assigned",
  startsOn: null,
  endsOn: null,
  notes: "",
  isActive: true,
};

type ProgramsPanelProps = {
  title?: string;
  description?: string;
  listGymGoers: () => Promise<CustomerRecord[]>;
};

function programToForm(program: TrainingProgram): TrainingProgramInput {
  return {
    title: program.title,
    summary: program.summary,
    goal: program.goal,
    difficulty: program.difficulty,
    status: program.status,
    content: program.content,
    isActive: program.isActive,
  };
}

function assignmentToForm(assignment: TrainingProgramAssignment): TrainingProgramAssignmentInput {
  return {
    program: assignment.program,
    customer: assignment.customer,
    status: assignment.status,
    startsOn: assignment.startsOn ?? null,
    endsOn: assignment.endsOn ?? null,
    notes: assignment.notes,
    isActive: assignment.isActive,
  };
}

export function ProgramsPanel({
  title = "Programs",
  description = "List, edit, and assign existing training program shells.",
  listGymGoers,
}: ProgramsPanelProps) {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [assignments, setAssignments] = useState<TrainingProgramAssignment[]>([]);
  const [gymGoers, setGymGoers] = useState<CustomerRecord[]>([]);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<TrainingProgramAssignment | null>(null);
  const [isProgramOpen, setIsProgramOpen] = useState(false);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const programForm = useForm<TrainingProgramInput>({
    resolver: zodResolver(trainingProgramCreateSchema),
    defaultValues: blankProgram,
    mode: "onBlur",
  });
  const assignmentForm = useForm<TrainingProgramAssignmentInput>({
    resolver: zodResolver(trainingProgramAssignmentCreateSchema),
    defaultValues: blankAssignment,
    mode: "onBlur",
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextPrograms, nextAssignments, nextGymGoers] = await Promise.all([
        listTrainingPrograms(),
        listTrainingProgramAssignments(),
        listGymGoers(),
      ]);
      setPrograms(nextPrograms);
      setAssignments(nextAssignments);
      setGymGoers(nextGymGoers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load programs.");
    } finally {
      setIsLoading(false);
    }
  }, [listGymGoers]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function openProgram(program: TrainingProgram) {
    setEditingProgram(program);
    programForm.reset(programToForm(program));
    setIsProgramOpen(true);
  }

  function openAssign(program?: TrainingProgram) {
    setEditingAssignment(null);
    assignmentForm.reset({
      ...blankAssignment,
      program: program?.id ?? programs[0]?.id ?? "",
      customer: gymGoers[0]?.id ?? "",
    });
    setIsAssignmentOpen(true);
  }

  function openAssignment(assignment: TrainingProgramAssignment) {
    setEditingAssignment(assignment);
    assignmentForm.reset(assignmentToForm(assignment));
    setIsAssignmentOpen(true);
  }

  async function saveProgram(values: TrainingProgramInput) {
    if (!editingProgram) {
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await updateTrainingProgram(editingProgram.id, trainingProgramCreateSchema.parse(values));
      setIsProgramOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save program.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAssignment(values: TrainingProgramAssignmentInput) {
    setError(null);
    setIsSaving(true);
    const payload = trainingProgramAssignmentCreateSchema.parse({
      ...values,
      startsOn: values.startsOn || null,
      endsOn: values.endsOn || null,
    });
    try {
      if (editingAssignment) {
        await updateTrainingProgramAssignment(editingAssignment.id, payload);
      } else {
        await createTrainingProgramAssignment(payload);
      }
      setIsAssignmentOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save assignment.");
    } finally {
      setIsSaving(false);
    }
  }

  async function cancelAssignment(assignment: TrainingProgramAssignment) {
    setError(null);
    try {
      await cancelTrainingProgramAssignment(assignment);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel assignment.");
    }
  }

  const programColumns: ColumnDef<TrainingProgram>[] = [
    {
      accessorKey: "title",
      header: "Program",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          <div className="text-xs text-zinc-500">{row.original.goal || row.original.summary || "Blank program shell"}</div>
        </div>
      ),
    },
    {
      accessorKey: "difficulty",
      header: "Difficulty",
      cell: ({ row }) => row.original.difficulty || "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
    },
    {
      accessorKey: "assignmentCount",
      header: "Assignments",
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openProgram(row.original)}>
            <Pencil className="size-3" />
            Edit
          </Button>
          <Button size="sm" onClick={() => openAssign(row.original)}>
            <Send className="size-3" />
            Assign
          </Button>
        </div>
      ),
    },
  ];

  const assignmentColumns: ColumnDef<TrainingProgramAssignment>[] = [
    {
      accessorKey: "programTitle",
      header: "Program",
    },
    {
      accessorKey: "customerName",
      header: "Gym goer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customerName || row.original.customerMembershipCode}</div>
          <div className="text-xs text-zinc-500">{row.original.customerMembershipCode}</div>
        </div>
      ),
    },
    {
      accessorKey: "assignedByName",
      header: "Assigned by",
      cell: ({ row }) => row.original.assignedByName || "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openAssignment(row.original)}>
            <Pencil className="size-3" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void cancelAssignment(row.original)}>
            <XCircle className="size-3" />
            Cancel
          </Button>
        </div>
      ),
    },
  ];

  const programOptions = programs.map((program) => ({ value: program.id, label: program.title }));
  const gymGoerOptions = gymGoers.map((customer) => ({
    value: customer.id,
    label: `${customer.fullName} (${customer.membershipCode})`,
  }));

  return (
    <div className="space-y-4">
      <Card className="rounded-md border-zinc-200 shadow-none">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-5 text-cyan-800" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void refresh()} disabled={isLoading}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button onClick={() => openAssign()} disabled={!programs.length || !gymGoers.length}>
              <Send className="size-4" />
              Assign program
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Program API unavailable</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <DataTable columns={programColumns} data={programs} emptyLabel={isLoading ? "Loading..." : "No programs found."} />
        </CardContent>
      </Card>

      <Card className="rounded-md border-zinc-200 shadow-none">
        <CardHeader>
          <CardTitle>Program assignments</CardTitle>
          <CardDescription>Assigned program shells by gym goer, status, and owner.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={assignmentColumns}
            data={assignments}
            emptyLabel={isLoading ? "Loading..." : "No program assignments found."}
          />
        </CardContent>
      </Card>

      <Dialog open={isProgramOpen} onOpenChange={setIsProgramOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit program shell</DialogTitle>
            <DialogDescription>Program content creation is intentionally blank for now.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={programForm.handleSubmit(saveProgram)} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <TextFormField control={programForm.control} name="title" label="Title" />
              <TextFormField control={programForm.control} name="goal" label="Goal" />
              <TextFormField control={programForm.control} name="difficulty" label="Difficulty" />
              <SelectFormField control={programForm.control} name="status" label="Status" options={programStatusOptions} />
              <TextareaFormField control={programForm.control} name="summary" label="Summary" className="md:col-span-2" />
            </div>
            <Button type="submit" disabled={isSaving}>
              Save program
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignmentOpen} onOpenChange={setIsAssignmentOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Edit assignment" : "Assign program"}</DialogTitle>
            <DialogDescription>Select an existing program shell and gym goer.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={assignmentForm.handleSubmit(saveAssignment)} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectFormField control={assignmentForm.control} name="program" label="Program" options={programOptions} />
              <SelectFormField control={assignmentForm.control} name="customer" label="Gym goer" options={gymGoerOptions} />
              <SelectFormField
                control={assignmentForm.control}
                name="status"
                label="Status"
                options={programAssignmentStatusOptions}
              />
              <TextFormField control={assignmentForm.control} name="startsOn" label="Starts on" type="date" />
              <TextFormField control={assignmentForm.control} name="endsOn" label="Ends on" type="date" />
              <TextareaFormField control={assignmentForm.control} name="notes" label="Notes" className="md:col-span-2" />
            </div>
            <Button type="submit" disabled={isSaving || !programOptions.length || !gymGoerOptions.length}>
              {editingAssignment ? "Save assignment" : "Assign program"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
