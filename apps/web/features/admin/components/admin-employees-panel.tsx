"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, UserMinus } from "lucide-react";
import { useForm } from "react-hook-form";
import { employeeFormSchema, type Employee, type EmployeeCreate, type EmployeeFormInput } from "@repo/domain";

import { DataTable } from "@/components/data/data-table";
import { EmployeeFormFields, roleLabel } from "@/components/domain/employee-form-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createEmployee, deactivateEmployee, listEmployees, updateEmployee } from "@/lib/api/admin";

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

function toEmployeePayload(values: EmployeeFormInput): EmployeeCreate {
  const parsed = employeeFormSchema.parse(values);
  return {
    ...parsed,
    displayName: parsed.displayName || parsed.fullName,
    startsOn: parsed.startsOn || null,
  };
}

export function AdminEmployeesPanel() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<EmployeeFormInput>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: blankEmployee,
    mode: "onBlur",
  });

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.isActive), [employees]);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      setEmployees(await listEmployees());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load employees.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  function openCreate() {
    setEditing(null);
    form.reset(blankEmployee);
    setIsOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    form.reset(employeeToForm(employee));
    setIsOpen(true);
  }

  async function saveEmployee(values: EmployeeFormInput) {
    setError(null);
    const payload = toEmployeePayload(values);
    try {
      if (editing) {
        await updateEmployee(editing.id, payload);
      } else {
        await createEmployee(payload);
      }
      setIsOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save employee.");
    }
  }

  async function deactivate(employee: Employee) {
    setError(null);
    try {
      await deactivateEmployee(employee);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to deactivate employee.");
    }
  }

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.fullName}</div>
          <div className="text-xs text-zinc-500">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "roleKind",
      header: "Role",
      cell: ({ row }) => roleLabel(row.original.roleKind),
    },
    {
      accessorKey: "jobTitle",
      header: "Job title",
      cell: ({ row }) => row.original.jobTitle || "-",
    },
    {
      accessorKey: "employmentStatus",
      header: "Status",
      cell: ({ row }) => <Badge variant="secondary">{roleLabel(row.original.employmentStatus)}</Badge>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openEdit(row.original)}>
            <Pencil className="size-3" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void deactivate(row.original)}>
            <UserMinus className="size-3" />
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="rounded-md">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Employees</CardTitle>
          <CardDescription>List, add, edit, and deactivate staff members.</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add employee
          </Button>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit employee" : "Add employee"}</DialogTitle>
              <DialogDescription>Employee profiles are organization-scoped and role-based.</DialogDescription>
            </DialogHeader>
            <form id="admin-employee-form" className="space-y-5" onSubmit={form.handleSubmit(saveEmployee)} noValidate>
              <EmployeeFormFields control={form.control} />
              <Button type="submit">{editing ? "Save changes" : "Create employee"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Admin API unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <DataTable columns={columns} data={activeEmployees} emptyLabel={isLoading ? "Loading..." : "No active employees found."} />
      </CardContent>
    </Card>
  );
}
