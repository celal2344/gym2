"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, RefreshCw, UserMinus } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  employeeFormSchema,
  type Employee,
  type EmployeeCreate,
  type EmployeeFormInput,
} from "@repo/domain";

import { DataTable } from "@/components/data/data-table";
import {
  EmployeeFormFields,
  roleLabel,
} from "@/components/domain/employee-form-fields";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const blankEmployee: EmployeeFormInput = {
  supabaseUserId: null,
  fullName: "",
  email: "",
  phone: "",
  displayName: "",
  roleKind: "personal_trainer",
  jobTitle: "",
  employmentStatus: "active",
  startsOn: null,
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
  isActive: true,
};

type ManagerStaffPanelProps = {
  title: string;
  description: string;
  createLabel: string;
  emptyLabel: string;
  fixedRole?: EmployeeCreate["roleKind"];
  listRecords: () => Promise<Employee[]>;
  createRecord: (payload: EmployeeCreate) => Promise<Employee>;
  updateRecord: (
    id: string,
    payload: Partial<EmployeeCreate>,
  ) => Promise<Employee>;
  deactivateRecord: (employee: Employee) => Promise<Employee>;
};

function employeeToForm(employee: Employee): EmployeeFormInput {
  return {
    supabaseUserId: employee.supabaseUserId ?? null,
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    displayName: employee.displayName,
    roleKind: employee.roleKind,
    jobTitle: employee.jobTitle,
    employmentStatus: employee.employmentStatus,
    startsOn: employee.startsOn ?? null,
    emergencyContactName: employee.emergencyContactName,
    emergencyContactPhone: employee.emergencyContactPhone,
    notes: employee.notes,
    isActive: employee.isActive,
  };
}

function toEmployeePayload(
  values: EmployeeFormInput,
  fixedRole?: EmployeeCreate["roleKind"],
): EmployeeCreate {
  const parsed = employeeFormSchema.parse(values);
  return {
    ...parsed,
    displayName: parsed.displayName || parsed.fullName,
    roleKind: fixedRole ?? parsed.roleKind,
    startsOn: parsed.startsOn || null,
  };
}

export function ManagerStaffPanel({
  title,
  description,
  createLabel,
  emptyLabel,
  fixedRole,
  listRecords,
  createRecord,
  updateRecord,
  deactivateRecord,
}: ManagerStaffPanelProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EmployeeFormInput>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      ...blankEmployee,
      roleKind: fixedRole ?? blankEmployee.roleKind,
    },
    mode: "onBlur",
  });

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.isActive),
    [employees],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setEmployees(await listRecords());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to load ${title.toLowerCase()}.`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [listRecords, title]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function openCreate() {
    setEditing(null);
    form.reset({
      ...blankEmployee,
      roleKind: fixedRole ?? blankEmployee.roleKind,
    });
    setIsOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    form.reset({
      ...employeeToForm(employee),
      roleKind: fixedRole ?? employee.roleKind,
    });
    setIsOpen(true);
  }

  async function saveEmployee(values: EmployeeFormInput) {
    setError(null);
    setIsSaving(true);
    const payload = toEmployeePayload(values, fixedRole);
    try {
      if (editing) {
        await updateRecord(editing.id, payload);
      } else {
        await createRecord(payload);
      }
      setIsOpen(false);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to save ${title.toLowerCase()}.`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deactivate(employee: Employee) {
    setError(null);
    try {
      await deactivateRecord(employee);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to deactivate ${title.toLowerCase()}.`,
      );
    }
  }

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.fullName}</div>
          <div className="text-xs text-zinc-500">
            {row.original.email || row.original.phone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "roleKind",
      header: "Role",
      cell: ({ row }) => (
        <span className="capitalize">{roleLabel(row.original.roleKind)}</span>
      ),
    },
    {
      accessorKey: "jobTitle",
      header: "Job title",
      cell: ({ row }) => row.original.jobTitle || "-",
    },
    {
      accessorKey: "employmentStatus",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {roleLabel(row.original.employmentStatus)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEdit(row.original)}
          >
            <Pencil className="size-3" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void deactivate(row.original)}
          >
            <UserMinus className="size-3" />
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="rounded-md border-zinc-200 shadow-none">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void refresh()}
            disabled={isLoading}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {createLabel}
            </Button>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editing ? `Edit ${title.toLowerCase()}` : createLabel}
                </DialogTitle>
                <DialogDescription>
                  Changes are saved to the current organization.
                </DialogDescription>
              </DialogHeader>
              <form
                id="manager-staff-form"
                className="space-y-5"
                onSubmit={form.handleSubmit(saveEmployee)}
                noValidate
              >
                <EmployeeFormFields
                  control={form.control}
                  fixedRole={fixedRole}
                />
                <Button type="submit" disabled={isSaving}>
                  {editing ? "Save changes" : "Create"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Manager API unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <DataTable
          columns={columns}
          data={activeEmployees}
          emptyLabel={isLoading ? "Loading..." : emptyLabel}
          label={title}
        />
      </CardContent>
    </Card>
  );
}
