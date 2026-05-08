"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, RefreshCw, UserMinus } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  customerFormSchema,
  type CustomerFormInput,
  type CustomerRecord,
} from "@repo/domain";

import { DataTable } from "@/components/data/data-table";
import { CustomerFormFields } from "@/components/domain/customer-form-fields";
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
import {
  createManagerGymGoer,
  deactivateManagerGymGoer,
  listManagerGymGoers,
  updateManagerGymGoer,
} from "@/lib/api/manager";

const blankGymGoer: CustomerFormInput = {
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

export function ManagerGymGoersPanel() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: blankGymGoer,
    mode: "onBlur",
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCustomers(await listManagerGymGoers());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load gym goers.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function openCreate() {
    setEditing(null);
    form.reset(blankGymGoer);
    setIsOpen(true);
  }

  function openEdit(customer: CustomerRecord) {
    setEditing(customer);
    form.reset(customerToForm(customer));
    setIsOpen(true);
  }

  async function saveCustomer(values: CustomerFormInput) {
    setError(null);
    setIsSaving(true);
    const payload = customerFormSchema.parse(values);
    try {
      if (editing) {
        await updateManagerGymGoer(editing.id, payload);
      } else {
        await createManagerGymGoer(payload);
      }
      setIsOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save gym goer.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deactivate(customer: CustomerRecord) {
    setError(null);
    try {
      await deactivateManagerGymGoer(customer);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove gym goer.",
      );
    }
  }

  const columns: ColumnDef<CustomerRecord>[] = [
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
      accessorKey: "membershipCode",
      header: "Membership",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <span className="block max-w-64 truncate">
          {row.original.notes || "-"}
        </span>
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
          <CardTitle>Gym goers</CardTitle>
          <CardDescription>
            List, add, edit, and remove customer profiles.
          </CardDescription>
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
              Add gym goer
            </Button>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit gym goer" : "Add gym goer"}
                </DialogTitle>
                <DialogDescription>
                  Gym goers are customer profiles with organization membership
                  codes.
                </DialogDescription>
              </DialogHeader>
              <form
                id="manager-gym-goer-form"
                className="space-y-5"
                onSubmit={form.handleSubmit(saveCustomer)}
                noValidate
              >
                <CustomerFormFields control={form.control} />
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
          data={customers}
          emptyLabel={isLoading ? "Loading..." : "No active gym goers found."}
          label="Gym goers"
        />
      </CardContent>
    </Card>
  );
}
