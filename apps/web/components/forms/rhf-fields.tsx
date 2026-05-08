"use client";

import { useId } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import type { TranslationKey } from "@repo/domain/i18n";
import { t } from "@repo/domain/i18n";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function errorMessage(message?: string) {
  return message ? t(message as TranslationKey) : undefined;
}

function normalizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function describedBy(...ids: Array<string | undefined>) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
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
  const reactId = useId().replace(/:/g, "");
  const fieldId = `${normalizeIdPart(String(name))}-${reactId}`;
  const inputId = `${fieldId}-input`;
  const errorId = `${fieldId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
          <Input
            {...field}
            id={inputId}
            type={type}
            value={field.value ?? ""}
            aria-invalid={fieldState.invalid}
            aria-describedby={describedBy(
              fieldState.invalid ? errorId : undefined,
            )}
            aria-errormessage={fieldState.invalid ? errorId : undefined}
          />
          {fieldState.invalid ? (
            <FieldError
              id={errorId}
              errors={[{ message: errorMessage(fieldState.error?.message) }]}
            />
          ) : null}
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
  const reactId = useId().replace(/:/g, "");
  const fieldId = `${normalizeIdPart(String(name))}-${reactId}`;
  const inputId = `${fieldId}-input`;
  const errorId = `${fieldId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
          <Textarea
            {...field}
            id={inputId}
            value={field.value ?? ""}
            aria-invalid={fieldState.invalid}
            aria-describedby={describedBy(
              fieldState.invalid ? errorId : undefined,
            )}
            aria-errormessage={fieldState.invalid ? errorId : undefined}
          />
          {fieldState.invalid ? (
            <FieldError
              id={errorId}
              errors={[{ message: errorMessage(fieldState.error?.message) }]}
            />
          ) : null}
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
  const reactId = useId().replace(/:/g, "");
  const fieldId = `${normalizeIdPart(String(name))}-${reactId}`;
  const inputId = `${fieldId}-input`;
  const errorId = `${fieldId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
          <Input
            id={inputId}
            name={field.name}
            type="number"
            min={min}
            value={field.value ?? 0}
            onChange={(event) => field.onChange(Number(event.target.value))}
            onBlur={field.onBlur}
            aria-invalid={fieldState.invalid}
            aria-describedby={describedBy(
              fieldState.invalid ? errorId : undefined,
            )}
            aria-errormessage={fieldState.invalid ? errorId : undefined}
          />
          {fieldState.invalid ? (
            <FieldError
              id={errorId}
              errors={[{ message: errorMessage(fieldState.error?.message) }]}
            />
          ) : null}
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
  const reactId = useId().replace(/:/g, "");
  const fieldId = `${normalizeIdPart(String(name))}-${reactId}`;
  const triggerId = `${fieldId}-trigger`;
  const errorId = `${fieldId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={triggerId}>{label}</FieldLabel>
          <Select
            name={field.name}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger
              id={triggerId}
              className="w-full"
              aria-invalid={fieldState.invalid}
              aria-describedby={describedBy(
                fieldState.invalid ? errorId : undefined,
              )}
              aria-errormessage={fieldState.invalid ? errorId : undefined}
            >
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
          {fieldState.invalid ? (
            <FieldError
              id={errorId}
              errors={[{ message: errorMessage(fieldState.error?.message) }]}
            />
          ) : null}
        </Field>
      )}
    />
  );
}
