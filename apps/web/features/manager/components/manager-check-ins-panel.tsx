"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { DoorOpen, Plus, RefreshCw, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  memberCheckInCreateSchema,
  memberCheckInMethods,
  type CheckInSummary,
  type CustomerRecord,
  type MemberCheckIn,
  type MemberCheckInInput,
  type Membership,
} from "@repo/domain";

import { DataTable } from "@/components/data/data-table";
import {
  SelectFormField,
  TextareaFormField,
} from "@/components/forms/rhf-fields";
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
  createManagerCheckIn,
  getManagerCheckInSummary,
  listManagerCheckIns,
  listManagerGymGoers,
  listManagerMemberships,
  voidManagerCheckIn,
} from "@/lib/api/manager";

const blankCheckIn: MemberCheckInInput = {
  customer: "",
  membership: null,
  method: "membership_code",
  source: "front_desk",
  notes: "",
  isVoided: false,
};

function label(value: string) {
  return value.replaceAll("_", " ");
}

function methodOptions() {
  return memberCheckInMethods.map((method) => ({
    value: method,
    label: label(method),
  }));
}

export function ManagerCheckInsPanel() {
  const [checkIns, setCheckIns] = useState<MemberCheckIn[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [summary, setSummary] = useState<CheckInSummary | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<MemberCheckInInput>({
    resolver: zodResolver(memberCheckInCreateSchema),
    defaultValues: blankCheckIn,
    mode: "onBlur",
  });
  const selectedCustomer = form.watch("customer");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextCheckIns, nextMemberships, nextCustomers, nextSummary] =
        await Promise.all([
          listManagerCheckIns(),
          listManagerMemberships(),
          listManagerGymGoers(),
          getManagerCheckInSummary(),
        ]);
      setCheckIns(nextCheckIns);
      setMemberships(nextMemberships);
      setCustomers(nextCustomers);
      setSummary(nextSummary);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load check-ins.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: `${customer.fullName} (${customer.membershipCode})`,
      })),
    [customers],
  );
  const membershipOptions = useMemo(
    () =>
      memberships
        .filter(
          (membership) =>
            !selectedCustomer || membership.customer === selectedCustomer,
        )
        .map((membership) => ({
          value: membership.id,
          label: `${membership.planName || label(membership.productKind)} - ${label(membership.status)}`,
        })),
    [memberships, selectedCustomer],
  );

  useEffect(() => {
    const currentMembership = form.getValues("membership");
    if (!selectedCustomer) {
      return;
    }
    if (
      currentMembership &&
      memberships.some(
        (membership) =>
          membership.id === currentMembership &&
          membership.customer === selectedCustomer,
      )
    ) {
      return;
    }
    form.setValue(
      "membership",
      memberships.find((membership) => membership.customer === selectedCustomer)
        ?.id ?? null,
    );
  }, [form, memberships, selectedCustomer]);

  function openCreate() {
    const customer = customers[0]?.id ?? "";
    const membership =
      memberships.find((item) => item.customer === customer)?.id ?? null;
    form.reset({ ...blankCheckIn, customer, membership });
    setIsOpen(true);
  }

  async function saveCheckIn(values: MemberCheckInInput) {
    setError(null);
    setIsSaving(true);
    try {
      await createManagerCheckIn(memberCheckInCreateSchema.parse(values));
      setIsOpen(false);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create check-in.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const columns: ColumnDef<MemberCheckIn>[] = [
    {
      accessorKey: "customerName",
      header: "Gym goer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.customerName || row.original.customerMembershipCode}
          </div>
          <div className="text-xs text-zinc-500">
            {row.original.customerMembershipCode}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "planName",
      header: "Membership",
      cell: ({ row }) =>
        row.original.planName || row.original.membershipStatus || "-",
    },
    {
      accessorKey: "checkedInAt",
      header: "Checked in",
      cell: ({ row }) =>
        row.original.checkedInAt
          ? new Date(row.original.checkedInAt).toLocaleString()
          : "-",
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => label(row.original.method),
    },
    {
      accessorKey: "isVoided",
      header: "State",
      cell: ({ row }) => (
        <Badge variant={row.original.isVoided ? "destructive" : "secondary"}>
          {row.original.isVoided ? "Voided" : "Active"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            disabled={row.original.isVoided}
            onClick={() => void voidManagerCheckIn(row.original).then(refresh)}
          >
            <XCircle className="size-3" />
            Void
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="rounded-md border-zinc-200 shadow-none">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <DoorOpen className="size-5 text-cyan-800" />
            Check-ins and attendance
          </CardTitle>
          <CardDescription>
            Front-desk attendance ledger for visits not tied to a class or
            trainer session.
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
          <Button onClick={openCreate} disabled={!customerOptions.length}>
            <Plus className="size-4" />
            Check in member
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-zinc-200 bg-white p-3">
            <p className="text-sm text-zinc-500">Today</p>
            <p className="text-2xl font-semibold">
              {summary?.todayCheckIns ?? 0}
            </p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white p-3">
            <p className="text-sm text-zinc-500">Membership-code</p>
            <p className="text-2xl font-semibold">
              {summary?.membershipCodeCheckIns ?? 0}
            </p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white p-3">
            <p className="text-sm text-zinc-500">Manual</p>
            <p className="text-2xl font-semibold">
              {summary?.manualCheckIns ?? 0}
            </p>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Check-in API unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DataTable
          columns={columns}
          data={checkIns}
          emptyLabel={isLoading ? "Loading..." : "No check-ins found."}
          label="Check-ins and attendance"
        />
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Check in member</DialogTitle>
            <DialogDescription>
              Creates an attendance record for front desk, kiosk, or manual
              access flows.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit(saveCheckIn)}
            noValidate
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectFormField
                control={form.control}
                name="customer"
                label="Gym goer"
                options={customerOptions}
              />
              <SelectFormField
                control={form.control}
                name="membership"
                label="Membership"
                options={membershipOptions}
                disabled={!membershipOptions.length}
              />
              <SelectFormField
                control={form.control}
                name="method"
                label="Method"
                options={methodOptions()}
              />
              <TextareaFormField
                control={form.control}
                name="notes"
                label="Notes"
                className="md:col-span-2"
              />
            </div>
            <Button
              type="submit"
              disabled={isSaving || !customerOptions.length}
            >
              Create check-in
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
