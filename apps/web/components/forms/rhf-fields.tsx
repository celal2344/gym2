"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import type { TranslationKey } from "@repo/domain/i18n";
import { t } from "@repo/domain/i18n";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function errorMessage(message?: string) {
  return message ? t(message as TranslationKey) : undefined;
}

type TextFormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  type?: string;
  className?: string;
};

export function TextFormField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  className,
}: TextFormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            {...field}
            id={field.name}
            type={type}
            value={field.value ?? ""}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid ? <FieldError errors={[{ message: errorMessage(fieldState.error?.message) }]} /> : null}
        </Field>
      )}
    />
  );
}

type TextareaFormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  className?: string;
};

export function TextareaFormField<T extends FieldValues>({
  control,
  name,
  label,
  className,
}: TextareaFormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Textarea {...field} id={field.name} value={field.value ?? ""} aria-invalid={fieldState.invalid} />
          {fieldState.invalid ? <FieldError errors={[{ message: errorMessage(fieldState.error?.message) }]} /> : null}
        </Field>
      )}
    />
  );
}

type NumberFormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  min?: number;
  className?: string;
};

export function NumberFormField<T extends FieldValues>({
  control,
  name,
  label,
  min = 0,
  className,
}: NumberFormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            id={field.name}
            name={field.name}
            type="number"
            min={min}
            value={field.value ?? 0}
            onChange={(event) => field.onChange(Number(event.target.value))}
            onBlur={field.onBlur}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid ? <FieldError errors={[{ message: errorMessage(fieldState.error?.message) }]} /> : null}
        </Field>
      )}
    />
  );
}

type SelectFormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
};

export function SelectFormField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  disabled = false,
  className,
}: SelectFormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Select name={field.name} value={field.value ?? ""} onValueChange={field.onChange} disabled={disabled}>
            <SelectTrigger id={field.name} className="w-full" aria-invalid={fieldState.invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.invalid ? <FieldError errors={[{ message: errorMessage(fieldState.error?.message) }]} /> : null}
        </Field>
      )}
    />
  );
}
