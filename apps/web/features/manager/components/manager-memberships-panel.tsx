"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { CreditCard, Pencil, Plus, RefreshCw, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  membershipAccessRules,
  membershipBillingCycles,
  membershipCreateSchema,
  membershipPlanCreateSchema,
  membershipProductKinds,
  membershipStatuses,
  type CustomerRecord,
  type Membership,
  type MembershipInput,
  type MembershipPlan,
  type MembershipPlanInput,
} from "@repo/domain";

import { DataTable } from "@/components/data/data-table";
import { NumberFormField, SelectFormField, TextareaFormField, TextFormField } from "@/components/forms/rhf-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createManagerMembership,
  createManagerMembershipPlan,
  deactivateManagerMembership,
  deactivateManagerMembershipPlan,
  listManagerGymGoers,
  listManagerMembershipPlans,
  listManagerMemberships,
  updateManagerMembership,
  updateManagerMembershipPlan,
} from "@/lib/api/manager";

const today = new Date().toISOString().slice(0, 10);

const blankPlan: MembershipPlanInput = {
  name: "",
  productKind: "membership",
  billingCycle: "monthly",
  accessRule: "unlimited",
  visitLimitPerPeriod: null,
  sessionCreditAmount: 0,
  priceAmount: 0,
  priceCurrency: "TRY",
  isActive: true,
};

const blankMembership: MembershipInput = {
  customer: "",
  plan: null,
  productKind: "membership",
  status: "active",
  validFrom: today,
  validTo: null,
  remainingCredits: 0,
  autoRenew: false,
  cancellationReason: "",
  externalPaymentReference: "",
  isActive: true,
};

function label(value: string) {
  return value.replaceAll("_", " ");
}

function options(values: readonly string[]) {
  return values.map((value) => ({ value, label: label(value) }));
}

function planToForm(plan: MembershipPlan): MembershipPlanInput {
  return {
    name: plan.name,
    productKind: plan.productKind,
    billingCycle: plan.billingCycle,
    accessRule: plan.accessRule,
    visitLimitPerPeriod: plan.visitLimitPerPeriod ?? null,
    sessionCreditAmount: plan.sessionCreditAmount,
    priceAmount: plan.priceAmount,
    priceCurrency: plan.priceCurrency,
    isActive: plan.isActive,
  };
}

function membershipToForm(membership: Membership): MembershipInput {
  return {
    customer: membership.customer,
    plan: membership.plan ?? null,
    productKind: membership.productKind,
    status: membership.status,
    validFrom: membership.validFrom,
    validTo: membership.validTo ?? null,
    remainingCredits: membership.remainingCredits,
    autoRenew: membership.autoRenew,
    cancellationReason: membership.cancellationReason,
    externalPaymentReference: membership.externalPaymentReference,
    isActive: membership.isActive,
  };
}

export function ManagerMembershipsPanel() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const planForm = useForm<MembershipPlanInput>({
    resolver: zodResolver(membershipPlanCreateSchema),
    defaultValues: blankPlan,
    mode: "onBlur",
  });
  const membershipForm = useForm<MembershipInput>({
    resolver: zodResolver(membershipCreateSchema),
    defaultValues: blankMembership,
    mode: "onBlur",
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextPlans, nextMemberships, nextCustomers] = await Promise.all([
        listManagerMembershipPlans(),
        listManagerMemberships(),
        listManagerGymGoers(),
      ]);
      setPlans(nextPlans);
      setMemberships(nextMemberships);
      setCustomers(nextCustomers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load memberships.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const planOptions = useMemo(() => plans.map((plan) => ({ value: plan.id, label: plan.name })), [plans]);
  const customerOptions = useMemo(
    () => customers.map((customer) => ({ value: customer.id, label: `${customer.fullName} (${customer.membershipCode})` })),
    [customers],
  );

  function openCreatePlan() {
    setEditingPlan(null);
    planForm.reset(blankPlan);
    setIsPlanOpen(true);
  }

  function openEditPlan(plan: MembershipPlan) {
    setEditingPlan(plan);
    planForm.reset(planToForm(plan));
    setIsPlanOpen(true);
  }

  function openCreateMembership() {
    setEditingMembership(null);
    membershipForm.reset({
      ...blankMembership,
      customer: customers[0]?.id ?? "",
      plan: plans[0]?.id ?? null,
      productKind: plans[0]?.productKind ?? "membership",
    });
    setIsMembershipOpen(true);
  }

  function openEditMembership(membership: Membership) {
    setEditingMembership(membership);
    membershipForm.reset(membershipToForm(membership));
    setIsMembershipOpen(true);
  }

  async function savePlan(values: MembershipPlanInput) {
    setError(null);
    setIsSaving(true);
    try {
      const payload = membershipPlanCreateSchema.parse(values);
      if (editingPlan) {
        await updateManagerMembershipPlan(editingPlan.id, payload);
      } else {
        await createManagerMembershipPlan(payload);
      }
      setIsPlanOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save membership plan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveMembership(values: MembershipInput) {
    setError(null);
    setIsSaving(true);
    try {
      const payload = membershipCreateSchema.parse({ ...values, validTo: values.validTo || null });
      if (editingMembership) {
        await updateManagerMembership(editingMembership.id, payload);
      } else {
        await createManagerMembership(payload);
      }
      setIsMembershipOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save membership.");
    } finally {
      setIsSaving(false);
    }
  }

  const planColumns: ColumnDef<MembershipPlan>[] = [
    {
      accessorKey: "name",
      header: "Plan",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs capitalize text-zinc-500">{label(row.original.accessRule)}</div>
        </div>
      ),
    },
    { accessorKey: "billingCycle", header: "Billing", cell: ({ row }) => label(row.original.billingCycle) },
    { accessorKey: "priceAmount", header: "Price", cell: ({ row }) => `${row.original.priceAmount} ${row.original.priceCurrency}` },
    { accessorKey: "activeMembershipCount", header: "Active members" },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditPlan(row.original)}>
            <Pencil className="size-3" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void deactivateManagerMembershipPlan(row.original).then(refresh)}>
            <XCircle className="size-3" />
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  const membershipColumns: ColumnDef<Membership>[] = [
    {
      accessorKey: "customerName",
      header: "Gym goer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customerName || row.original.customerMembershipCode}</div>
          <div className="text-xs text-zinc-500">{row.original.customerMembershipCode}</div>
        </div>
      ),
    },
    { accessorKey: "planName", header: "Plan", cell: ({ row }) => row.original.planName || label(row.original.productKind) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="secondary">{label(row.original.status)}</Badge> },
    { accessorKey: "validTo", header: "Valid to", cell: ({ row }) => row.original.validTo || "Open ended" },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditMembership(row.original)}>
            <Pencil className="size-3" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void deactivateManagerMembership(row.original).then(refresh)}>
            <XCircle className="size-3" />
            Cancel
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="rounded-md border-zinc-200 shadow-none">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-cyan-800" />
              Membership lifecycle
            </CardTitle>
            <CardDescription>Manage sellable plans, member status, freezes, cancellations, and external references.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void refresh()} disabled={isLoading}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={openCreatePlan}>
              <Plus className="size-4" />
              New plan
            </Button>
            <Button onClick={openCreateMembership} disabled={!customerOptions.length}>
              <Plus className="size-4" />
              Assign membership
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Membership API unavailable</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <DataTable columns={planColumns} data={plans} emptyLabel={isLoading ? "Loading..." : "No membership plans found."} />
        </CardContent>
      </Card>

      <Card className="rounded-md border-zinc-200 shadow-none">
        <CardHeader>
          <CardTitle>Member memberships</CardTitle>
          <CardDescription>Current memberships, credit packs, trials, freezes, cancellations, and expirations.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={membershipColumns} data={memberships} emptyLabel={isLoading ? "Loading..." : "No memberships found."} />
        </CardContent>
      </Card>

      <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit membership plan" : "New membership plan"}</DialogTitle>
            <DialogDescription>Plan pricing is recorded only; payment collection is handled externally.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={planForm.handleSubmit(savePlan)} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <TextFormField control={planForm.control} name="name" label="Name" />
              <SelectFormField control={planForm.control} name="productKind" label="Product" options={options(membershipProductKinds)} />
              <SelectFormField control={planForm.control} name="billingCycle" label="Billing cycle" options={options(membershipBillingCycles)} />
              <SelectFormField control={planForm.control} name="accessRule" label="Access rule" options={options(membershipAccessRules)} />
              <NumberFormField control={planForm.control} name="visitLimitPerPeriod" label="Visit limit" min={0} />
              <NumberFormField control={planForm.control} name="sessionCreditAmount" label="Session credits" min={0} />
              <NumberFormField control={planForm.control} name="priceAmount" label="Price amount" min={0} />
              <TextFormField control={planForm.control} name="priceCurrency" label="Currency" />
            </div>
            <Button type="submit" disabled={isSaving}>
              Save plan
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMembershipOpen} onOpenChange={setIsMembershipOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMembership ? "Edit membership" : "Assign membership"}</DialogTitle>
            <DialogDescription>Track lifecycle state without collecting payment inside GymOps.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={membershipForm.handleSubmit(saveMembership)} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectFormField control={membershipForm.control} name="customer" label="Gym goer" options={customerOptions} />
              <SelectFormField control={membershipForm.control} name="plan" label="Plan" options={planOptions} disabled={!planOptions.length} />
              <SelectFormField control={membershipForm.control} name="productKind" label="Product" options={options(membershipProductKinds)} />
              <SelectFormField control={membershipForm.control} name="status" label="Status" options={options(membershipStatuses)} />
              <TextFormField control={membershipForm.control} name="validFrom" label="Valid from" type="date" />
              <TextFormField control={membershipForm.control} name="validTo" label="Valid to" type="date" />
              <NumberFormField control={membershipForm.control} name="remainingCredits" label="Remaining credits" min={0} />
              <TextFormField control={membershipForm.control} name="externalPaymentReference" label="External reference" />
              <TextareaFormField control={membershipForm.control} name="cancellationReason" label="Cancellation reason" className="md:col-span-2" />
            </div>
            <Button type="submit" disabled={isSaving || !customerOptions.length}>
              Save membership
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
