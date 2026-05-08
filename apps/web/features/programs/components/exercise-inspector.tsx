"use client";

import { Trash2 } from "lucide-react";
import type { ProgramExercise } from "@repo/domain";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ExerciseInspectorProps = {
  exercise: ProgramExercise;
  onChange: (exercise: ProgramExercise) => void;
  onDelete: () => void;
};

export function ExerciseInspector({
  exercise,
  onChange,
  onDelete,
}: ExerciseInspectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel>Exercise name</FieldLabel>
          <Input
            aria-label="Exercise name"
            value={exercise.exerciseName}
            onChange={(event) =>
              onChange({ ...exercise, exerciseName: event.target.value })
            }
          />
        </Field>
        <Field>
          <FieldLabel>Target muscles</FieldLabel>
          <Input
            aria-label="Target muscles"
            value={exercise.targetMuscles}
            onChange={(event) =>
              onChange({ ...exercise, targetMuscles: event.target.value })
            }
          />
        </Field>
        <Field>
          <FieldLabel>Equipment</FieldLabel>
          <Input
            aria-label="Equipment"
            value={exercise.equipment}
            onChange={(event) =>
              onChange({ ...exercise, equipment: event.target.value })
            }
          />
        </Field>
        <Field>
          <FieldLabel>Sets</FieldLabel>
          <Input
            aria-label="Sets"
            type="number"
            min={1}
            max={20}
            value={exercise.sets}
            onChange={(event) =>
              onChange({ ...exercise, sets: Number(event.target.value) })
            }
          />
        </Field>
        <Field>
          <FieldLabel>Reps / duration</FieldLabel>
          <Input
            aria-label="Reps / duration"
            value={exercise.reps}
            onChange={(event) =>
              onChange({ ...exercise, reps: event.target.value })
            }
          />
        </Field>
        <Field>
          <FieldLabel>Rest seconds</FieldLabel>
          <Input
            aria-label="Rest seconds"
            type="number"
            min={0}
            max={600}
            value={exercise.restSeconds}
            onChange={(event) =>
              onChange({ ...exercise, restSeconds: Number(event.target.value) })
            }
          />
        </Field>
      </div>

      <Field>
        <FieldLabel>Setup cue</FieldLabel>
        <Textarea
          aria-label="Setup cue"
          value={exercise.visualCue.setup}
          onChange={(event) =>
            onChange({
              ...exercise,
              visualCue: { ...exercise.visualCue, setup: event.target.value },
            })
          }
        />
      </Field>
      <Field>
        <FieldLabel>Action cue</FieldLabel>
        <Textarea
          aria-label="Action cue"
          value={exercise.visualCue.action}
          onChange={(event) =>
            onChange({
              ...exercise,
              visualCue: { ...exercise.visualCue, action: event.target.value },
            })
          }
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel>Tempo</FieldLabel>
          <Input
            aria-label="Tempo"
            value={exercise.visualCue.tempo}
            onChange={(event) =>
              onChange({
                ...exercise,
                visualCue: { ...exercise.visualCue, tempo: event.target.value },
              })
            }
          />
        </Field>
        <Field>
          <FieldLabel>Breathing</FieldLabel>
          <Input
            aria-label="Breathing"
            value={exercise.visualCue.breathing}
            onChange={(event) =>
              onChange({
                ...exercise,
                visualCue: {
                  ...exercise.visualCue,
                  breathing: event.target.value,
                },
              })
            }
          />
        </Field>
      </div>
      <Field>
        <FieldLabel>Safety cue</FieldLabel>
        <Textarea
          aria-label="Safety cue"
          value={exercise.visualCue.safety}
          onChange={(event) =>
            onChange({
              ...exercise,
              visualCue: { ...exercise.visualCue, safety: event.target.value },
            })
          }
        />
      </Field>
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        Free visual source option: Free Exercise DB is Unlicense and exposes
        hosted image paths through GitHub raw URLs.
      </div>
      <Field>
        <FieldLabel>Image URL</FieldLabel>
        <Input
          aria-label="Image URL"
          value={exercise.visualCue.imageUrl}
          placeholder="Optional hosted image URL"
          onChange={(event) =>
            onChange({
              ...exercise,
              visualCue: {
                ...exercise.visualCue,
                imageUrl: event.target.value,
              },
            })
          }
        />
      </Field>
      <Field>
        <FieldLabel>Source URL</FieldLabel>
        <Input
          aria-label="Source URL"
          value={exercise.visualCue.sourceUrl}
          onChange={(event) =>
            onChange({
              ...exercise,
              visualCue: {
                ...exercise.visualCue,
                sourceUrl: event.target.value,
              },
            })
          }
        />
      </Field>
      <Field>
        <FieldLabel>Coach notes</FieldLabel>
        <Textarea
          aria-label="Coach notes"
          value={exercise.notes}
          onChange={(event) =>
            onChange({ ...exercise, notes: event.target.value })
          }
        />
      </Field>
      <Button type="button" variant="destructive" onClick={onDelete}>
        <Trash2 className="size-4" />
        Delete exercise
      </Button>
    </div>
  );
}
