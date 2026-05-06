"use client";

import type { Control } from "react-hook-form";
import { customerStatuses, type CustomerFormInput } from "@repo/domain";
import { t } from "@repo/domain/i18n";

import { SelectFormField, TextareaFormField, TextFormField } from "@/components/forms/rhf-fields";

export function CustomerFormFields({
  control,
  includeStatus = true,
}: {
  control: Control<CustomerFormInput>;
  includeStatus?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextFormField control={control} name="fullName" label={t("admin.fields.name")} />
      <TextFormField control={control} name="email" label={t("admin.fields.email")} />
      <TextFormField control={control} name="phone" label={t("admin.fields.phone")} />
      <TextFormField control={control} name="membershipCode" label={t("admin.fields.membershipCode")} />
      {includeStatus ? (
        <SelectFormField
          control={control}
          name="status"
          label={t("admin.fields.status")}
          options={customerStatuses.map((status) => ({ value: status, label: status }))}
        />
      ) : null}
      <TextareaFormField control={control} name="notes" label={t("admin.fields.notes")} className="md:col-span-2" />
    </div>
  );
}
