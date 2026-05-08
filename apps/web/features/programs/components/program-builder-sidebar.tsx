"use client";

import { Plus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type {
  TrainingProgramContent,
  TrainingProgramInput,
} from "@repo/domain";

import {
  SelectFormField,
  TextareaFormField,
  TextFormField,
} from "@/components/forms/rhf-fields";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { programStatusOptions } from "../constants";

type ProgramBuilderSidebarProps = {
  form: UseFormReturn<TrainingProgramInput>;
  content: TrainingProgramContent;
  activeWeekIndex: number;
  onAddWeek: () => void;
  onSelectWeek: (index: number) => void;
};

export function ProgramBuilderSidebar({
  form,
  content,
  activeWeekIndex,
  onAddWeek,
  onSelectWeek,
}: ProgramBuilderSidebarProps) {
  return (
    <div className="min-w-0 space-y-4">
      <Card className="rounded-md border-zinc-200 shadow-none">
        <CardHeader>
          <CardTitle>Program info</CardTitle>
          <CardDescription>
            Keep this short enough for trainers and members to scan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TextFormField control={form.control} name="title" label="Title" />
          <TextFormField control={form.control} name="goal" label="Goal" />
          <TextFormField
            control={form.control}
            name="difficulty"
            label="Difficulty"
          />
          <SelectFormField
            control={form.control}
            name="status"
            label="Status"
            options={programStatusOptions}
          />
          <TextareaFormField
            control={form.control}
            name="summary"
            label="Summary"
          />
        </CardContent>
      </Card>

      <Card className="rounded-md border-zinc-200 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Weeks</CardTitle>
            <CardDescription>Navigate the program structure.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onAddWeek}>
            <Plus className="size-3" />
            Week
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {content.weeks.map((week, index) => (
            <button
              type="button"
              key={week.id}
              className={`w-full rounded-md border p-3 text-left text-sm transition ${
                index === activeWeekIndex
                  ? "border-cyan-800 bg-cyan-50"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
              }`}
              onClick={() => onSelectWeek(index)}
            >
              <span className="block font-medium">{week.title}</span>
              <span className="text-xs text-zinc-500">
                {week.days.length} days -{" "}
                {week.days.reduce(
                  (total, day) => total + day.exercises.length,
                  0,
                )}{" "}
                exercises
              </span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
