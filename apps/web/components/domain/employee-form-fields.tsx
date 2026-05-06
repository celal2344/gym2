"use client";

import type { Control } from "react-hook-form";
import { type EmployeeFormInput, staffRoles } from "@repo/domain";
import { t } from "@repo/domain/i18n";

import { SelectFormField, TextareaFormField, TextFormField } from "@/components/forms/rhf-fields";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}

export function EmployeeFormFields({
  control,
  fixedRole,
}: {
  control: Control<EmployeeFormInput>;
  fixedRole?: EmployeeFormInput["roleKind"];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextFormField control={control} name="fullName" label={t("admin.fields.name")} />
      <TextFormField control={control} name="displayName" label="Display name" />
      <TextFormField control={control} name="email" label={t("admin.fields.email")} />
      <TextFormField control={control} name="phone" label={t("admin.fields.phone")} />
      {fixedRole ? (
        <Field>
          <FieldLabel>{t("admin.fields.role")}</FieldLabel>
          <Input value={roleLabel(fixedRole)} disabled />
        </Field>
      ) : (
        <SelectFormField
          control={control}
          name="roleKind"
          label={t("admin.fields.role")}
          options={staffRoles.map((role) => ({ value: role, label: roleLabel(role) }))}
        />
      )}
      <TextFormField control={control} name="jobTitle" label={t("admin.fields.jobTitle")} />
      <TextFormField control={control} name="startsOn" label="Start date" type="date" />
      <TextFormField control={control} name="emergencyContactName" label="Emergency contact" />
      <TextFormField control={control} name="emergencyContactPhone" label="Emergency phone" />
      <TextareaFormField control={control} name="notes" label={t("admin.fields.notes")} className="md:col-span-2" />
    </div>
  );
}
