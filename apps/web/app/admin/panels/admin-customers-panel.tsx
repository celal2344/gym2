"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, UserMinus } from "lucide-react";
import { useForm } from "react-hook-form";
import { customerFormSchema, type CustomerFormInput, type CustomerRecord } from "@repo/domain";

import { DataTable } from "@/components/data/data-table";
import { CustomerFormFields } from "@/components/domain/customer-form-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createCustomer, deactivateCustomer, listCustomers, updateCustomer } from "@/lib/api/admin";

const blankCustomer: CustomerFormInput = {
  supabaseUserId: null,
  fullName: "",
  email: "",
  phone: "",
  membershipCode: "",
  status: "active",
  notes: "",
  isActive: true,
};

function customerToForm(customer: CustomerRecord): CustomerFormInput {
  return {
    supabaseUserId: customer.supabaseUserId ?? null,
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone,
    membershipCode: customer.membershipCode,
    status: customer.status,
    notes: customer.notes,
    isActive: customer.isActive,
  };
}

export function AdminCustomersPanel() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: blankCustomer,
    mode: "onBlur",
  });

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      setCustomers(await listCustomers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  function openCreate() {
    setEditing(null);
    form.reset(blankCustomer);
    setIsOpen(true);
  }

  function openEdit(customer: CustomerRecord) {
    setEditing(customer);
    form.reset(customerToForm(customer));
    setIsOpen(true);
  }

  async function saveCustomer(values: CustomerFormInput) {
    setError(null);
    const payload = customerFormSchema.parse(values);
    try {
      if (editing) {
        await updateCustomer(editing.id, payload);
      } else {
        await createCustomer(payload);
      }
      setIsOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save user.");
    }
  }

  async function deactivate(customer: CustomerRecord) {
    setError(null);
    try {
      await deactivateCustomer(customer);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to deactivate user.");
    }
  }

  const columns: ColumnDef<CustomerRecord>[] = [
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
      accessorKey: "membershipCode",
      header: "Membership",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => <span className="block max-w-64 truncate">{row.original.notes || "-"}</span>,
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

  const activeCustomers = useMemo(() => customers.filter((customer) => customer.isActive), [customers]);

  return (
    <Card className="rounded-md">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Users</CardTitle>
          <CardDescription>List, add, edit, and deactivate gym customers.</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add user
          </Button>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
              <DialogDescription>Users are gym customers with membership records.</DialogDescription>
            </DialogHeader>
            <form id="admin-customer-form" className="space-y-5" onSubmit={form.handleSubmit(saveCustomer)} noValidate>
              <CustomerFormFields control={form.control} includeStatus={false} />
              <Button type="submit">{editing ? "Save changes" : "Create user"}</Button>
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
        <DataTable columns={columns} data={activeCustomers} emptyLabel={isLoading ? "Loading..." : "No active users found."} />
      </CardContent>
    </Card>
  );
}
