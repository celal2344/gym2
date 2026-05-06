"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Pencil, Plus, RefreshCw, Repeat, Trash2, XCircle } from "lucide-react";
import {
  type GenerateTrainingSessionOccurrences,
  trainingSessionKinds,
  trainingSessionOccurrenceStatuses,
  trainingSessionPaymentStatuses,
  trainingSessionPlanStatuses,
  type CustomerRecord,
  type Employee,
  type TrainingSessionOccurrence,
  type TrainingSessionOccurrenceCreate,
  type TrainingSessionPlan,
  type TrainingSessionPlanCreate,
} from "@repo/domain";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  createManagerSessionOccurrence,
  createManagerSessionPlan,
  deactivateManagerSessionPlan,
  deleteManagerSessionOccurrence,
  generateManagerSessionOccurrences,
  listManagerGymGoers,
  listManagerSessionOccurrences,
  listManagerSessionPlans,
  listManagerTrainers,
  updateManagerSessionOccurrence,
  updateManagerSessionPlan,
} from "@/lib/api/manager";

const blankPlan: TrainingSessionPlanCreate = {
  customer: "",
  trainer: "",
  title: "",
  sessionKind: "personal_training",
  status: "active",
  paymentStatus: "external_pending",
  paymentAmount: 0,
  amountPaid: 0,
  paymentCurrency: "TRY",
  paymentProvider: "",
  externalPaymentReference: "",
  paidAt: null,
  paymentNotes: "",
  totalSessions: 8,
  defaultDurationMin: 60,
  startsOn: null,
  endsOn: null,
  details: "",
  isActive: true,
};

const blankGenerateForm: GenerateTrainingSessionOccurrences = {
  startDate: new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  weekdays: [1],
  count: undefined,
  durationMin: undefined,
  locationName: "",
  notes: "",
};

const blankOccurrence: TrainingSessionOccurrenceCreate = {
  plan: "",
  sequenceNumber: 1,
  startsAt: "",
  endsAt: "",
  status: "scheduled",
  locationName: "",
  notes: "",
};

function label(value: string) {
  return value.replaceAll("_", " ");
}

function occurrenceStatusClass(status: TrainingSessionOccurrence["status"]) {
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-900";
  }
  if (status === "cancelled" || status === "no_show") {
    return "bg-rose-50 text-rose-900";
  }
  if (status === "rescheduled") {
    return "bg-amber-50 text-amber-900";
  }
  return "bg-cyan-50 text-cyan-950";
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en", { month: "long", year: "numeric" });
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toInputDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function fromInputDateTime(value: string) {
  return value ? new Date(value).toISOString() : "";
}

function planToForm(plan: TrainingSessionPlan): TrainingSessionPlanCreate {
  return {
    customer: plan.customer,
    trainer: plan.trainer,
    title: plan.title,
    sessionKind: plan.sessionKind,
    status: plan.status,
    paymentStatus: plan.paymentStatus,
    paymentAmount: plan.paymentAmount,
    amountPaid: plan.amountPaid,
    paymentCurrency: plan.paymentCurrency,
    paymentProvider: plan.paymentProvider,
    externalPaymentReference: plan.externalPaymentReference,
    paidAt: plan.paidAt ?? null,
    paymentNotes: plan.paymentNotes,
    totalSessions: plan.totalSessions,
    defaultDurationMin: plan.defaultDurationMin,
    startsOn: plan.startsOn ?? null,
    endsOn: plan.endsOn ?? null,
    details: plan.details,
    isActive: plan.isActive,
  };
}

function occurrenceToForm(occurrence: TrainingSessionOccurrence): TrainingSessionOccurrenceCreate {
  return {
    plan: occurrence.plan,
    sequenceNumber: occurrence.sequenceNumber,
    startsAt: occurrence.startsAt,
    endsAt: occurrence.endsAt,
    status: occurrence.status,
    locationName: occurrence.locationName,
    notes: occurrence.notes,
  };
}

export function ManagerSessionsPanel() {
  const [plans, setPlans] = useState<TrainingSessionPlan[]>([]);
  const [occurrences, setOccurrences] = useState<TrainingSessionOccurrence[]>([]);
  const [trainers, setTrainers] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [calendarMode, setCalendarMode] = useState<"month" | "week" | "day">("month");
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [editingPlan, setEditingPlan] = useState<TrainingSessionPlan | null>(null);
  const [editingOccurrence, setEditingOccurrence] = useState<TrainingSessionOccurrence | null>(null);
  const [generatePlan, setGeneratePlan] = useState<TrainingSessionPlan | null>(null);
  const [planForm, setPlanForm] = useState<TrainingSessionPlanCreate>(blankPlan);
  const [occurrenceForm, setOccurrenceForm] = useState<TrainingSessionOccurrenceCreate>(blankOccurrence);
  const [generateForm, setGenerateForm] = useState<GenerateTrainingSessionOccurrences>(blankGenerateForm);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isOccurrenceOpen, setIsOccurrenceOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const year = month.getFullYear();
  const monthNumber = month.getMonth() + 1;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextPlans, nextOccurrences, nextTrainers, nextCustomers] = await Promise.all([
        listManagerSessionPlans({
          trainer: trainerFilter === "all" ? undefined : trainerFilter,
          customer: customerFilter === "all" ? undefined : customerFilter,
        }),
        listManagerSessionOccurrences(year, monthNumber, {
          trainer: trainerFilter === "all" ? undefined : trainerFilter,
          customer: customerFilter === "all" ? undefined : customerFilter,
        }),
        listManagerTrainers(),
        listManagerGymGoers(),
      ]);
      setPlans(nextPlans);
      setOccurrences(nextOccurrences);
      setTrainers(nextTrainers);
      setCustomers(nextCustomers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load session data.");
    } finally {
      setIsLoading(false);
    }
  }, [customerFilter, monthNumber, trainerFilter, year]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const occurrencesByDay = useMemo(() => {
    const grouped = new Map<string, TrainingSessionOccurrence[]>();
    for (const occurrence of occurrences) {
      const key = dayKey(new Date(occurrence.startsAt));
      grouped.set(key, [...(grouped.get(key) ?? []), occurrence]);
    }
    return grouped;
  }, [occurrences]);

  const calendarDays = useMemo(() => {
    if (calendarMode === "day") {
      return [new Date(year, month.getMonth(), month.getDate())];
    }
    if (calendarMode === "week") {
      const selected = new Date(year, month.getMonth(), month.getDate());
      const weekStart = new Date(selected);
      weekStart.setDate(selected.getDate() - selected.getDay() + 1);
      return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + index);
        return day;
      });
    }
    const first = new Date(year, month.getMonth(), 1);
    const last = new Date(year, month.getMonth() + 1, 0);
    const days: Date[] = [];
    for (let day = 1; day <= last.getDate(); day += 1) {
      days.push(new Date(first.getFullYear(), first.getMonth(), day));
    }
    return days;
  }, [calendarMode, month, year]);

  function openCreatePlan() {
    setEditingPlan(null);
    setPlanForm({
      ...blankPlan,
      customer: customers[0]?.id ?? "",
      trainer: trainers[0]?.id ?? "",
    });
    setIsPlanOpen(true);
  }

  function openEditPlan(plan: TrainingSessionPlan) {
    setEditingPlan(plan);
    setPlanForm(planToForm(plan));
    setIsPlanOpen(true);
  }

  function openCreateOccurrence(plan?: TrainingSessionPlan) {
    const selectedPlan = plan ?? plans[0];
    const startsAt = new Date();
    startsAt.setMinutes(0, 0, 0);
    const duration = selectedPlan?.defaultDurationMin ?? 60;
    const endsAt = new Date(startsAt.getTime() + duration * 60_000);
    setEditingOccurrence(null);
    setOccurrenceForm({
      ...blankOccurrence,
      plan: selectedPlan?.id ?? "",
      sequenceNumber: selectedPlan ? selectedPlan.scheduledCount + 1 : 1,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
    setIsOccurrenceOpen(true);
  }

  function openEditOccurrence(occurrence: TrainingSessionOccurrence) {
    setEditingOccurrence(occurrence);
    setOccurrenceForm(occurrenceToForm(occurrence));
    setIsOccurrenceOpen(true);
  }

  async function savePlan() {
    setError(null);
    try {
      if (editingPlan) {
        await updateManagerSessionPlan(editingPlan.id, planForm);
      } else {
        await createManagerSessionPlan(planForm);
      }
      setIsPlanOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save session plan.");
    }
  }

  async function saveOccurrence() {
    setError(null);
    try {
      if (editingOccurrence) {
        await updateManagerSessionOccurrence(editingOccurrence.id, occurrenceForm);
      } else {
        await createManagerSessionOccurrence(occurrenceForm);
      }
      setIsOccurrenceOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save scheduled session.");
    }
  }

  async function changeOccurrenceStatus(occurrence: TrainingSessionOccurrence, status: TrainingSessionOccurrence["status"]) {
    setError(null);
    try {
      await updateManagerSessionOccurrence(occurrence.id, { status });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update scheduled session.");
    }
  }

  async function removeOccurrence(occurrence: TrainingSessionOccurrence) {
    setError(null);
    try {
      await deleteManagerSessionOccurrence(occurrence);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove scheduled session.");
    }
  }

  function openGenerate(plan: TrainingSessionPlan) {
    setGeneratePlan(plan);
    setGenerateForm({
      ...blankGenerateForm,
      startDate: plan.startsOn ?? blankGenerateForm.startDate,
      count: Math.max(plan.totalSessions - plan.scheduledCount, 1),
      durationMin: plan.defaultDurationMin,
    });
    setIsGenerateOpen(true);
  }

  async function generateOccurrences() {
    if (!generatePlan) {
      return;
    }
    setError(null);
    try {
      await generateManagerSessionOccurrences(generatePlan.id, generateForm);
      setIsGenerateOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate sessions.");
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Session API unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="rounded-md border-zinc-200 shadow-none">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-cyan-800" />
              Session calendar
            </CardTitle>
            <CardDescription>Trainer-led sessions scheduled for the selected month.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={calendarMode} onValueChange={(value) => setCalendarMode(value as typeof calendarMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setMonth(new Date(year, month.getMonth() - 1, 1))}>
              Previous
            </Button>
            <Button variant="outline" onClick={() => setMonth(new Date(year, month.getMonth() + 1, 1))}>
              Next
            </Button>
            <Button variant="outline" onClick={() => void refresh()} disabled={isLoading}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button onClick={() => openCreateOccurrence()}>
              <Plus className="size-4" />
              Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="Trainer filter"
              value={trainerFilter}
              values={["all", ...trainers.map((trainer) => trainer.id)]}
              getLabel={(id) => (id === "all" ? "All trainers" : trainers.find((trainer) => trainer.id === id)?.fullName ?? id)}
              onChange={setTrainerFilter}
            />
            <SelectField
              label="Gym goer filter"
              value={customerFilter}
              values={["all", ...customers.map((customer) => customer.id)]}
              getLabel={(id) => (id === "all" ? "All gym goers" : customers.find((customer) => customer.id === id)?.fullName ?? id)}
              onChange={setCustomerFilter}
            />
          </div>
          <div className="text-lg font-semibold">{monthLabel(month)}</div>
          <div className={`grid gap-2 ${calendarMode === "day" ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-7"}`}>
            {calendarDays.map((date) => {
              const items = occurrencesByDay.get(dayKey(date)) ?? [];
              return (
                <div key={dayKey(date)} className="min-h-32 rounded-md border border-zinc-200 bg-white p-2">
                  <div className="text-sm font-medium">{date.getDate()}</div>
                  <div className="mt-2 space-y-2">
                    {items.slice(0, 3).map((occurrence) => (
                      <button
                        key={occurrence.id}
                        type="button"
                        className={`w-full rounded-md p-2 text-left text-xs ${occurrenceStatusClass(occurrence.status)}`}
                        onClick={() => openEditOccurrence(occurrence)}
                      >
                        <span className="block font-medium">{occurrence.planTitle}</span>
                        <span className="block">{new Date(occurrence.startsAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="block truncate">{occurrence.trainerName} / {occurrence.customerName}</span>
                      </button>
                    ))}
                    {items.length > 3 ? <Badge variant="secondary">+{items.length - 3} more</Badge> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md border-zinc-200 shadow-none">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Session plans</CardTitle>
            <CardDescription>Payment, package length, trainer, gym goer, and session details.</CardDescription>
          </div>
          <Button onClick={openCreatePlan}>
            <Plus className="size-4" />
            Add plan
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Gym goer</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="font-medium">{plan.title}</div>
                      <div className="text-xs text-zinc-500">{label(plan.sessionKind)} / {label(plan.status)}</div>
                      {plan.totalSessions - plan.scheduledCount > 0 ? (
                        <Badge variant="outline" className="mt-2 rounded-md">
                          {plan.totalSessions - plan.scheduledCount} unscheduled
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{plan.trainerName}</TableCell>
                    <TableCell>{plan.customerName}</TableCell>
                    <TableCell>
                      {plan.scheduledCount}/{plan.totalSessions} scheduled
                      <div className="text-xs text-zinc-500">{plan.completedCount} completed</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.paymentStatus === "paid" ? "default" : "secondary"}>{label(plan.paymentStatus)}</Badge>
                      <div className="text-xs text-zinc-500">
                        {plan.amountPaid}/{plan.paymentAmount} {plan.paymentCurrency}
                      </div>
                      <div className="text-xs text-zinc-500">Due: {plan.amountDue}</div>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => openGenerate(plan)}>
                        <Repeat className="size-3" />
                        Generate
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openCreateOccurrence(plan)}>
                        <CalendarDays className="size-3" />
                        Schedule
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditPlan(plan)}>
                        <Pencil className="size-3" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void deactivateManagerSessionPlan(plan).then(refresh)}>
                        <XCircle className="size-3" />
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-zinc-500">
                      No session plans found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md border-zinc-200 shadow-none">
        <CardHeader>
          <CardTitle>Month sessions</CardTitle>
          <CardDescription>Update attendance status or remove scheduled occurrences.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Gym goer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {occurrences.map((occurrence) => (
                  <TableRow key={occurrence.id}>
                    <TableCell>
                      <div className="font-medium">{new Date(occurrence.startsAt).toLocaleDateString()}</div>
                      <div className="text-xs text-zinc-500">
                        {new Date(occurrence.startsAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}-
                        {new Date(occurrence.endsAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </TableCell>
                    <TableCell>{occurrence.planTitle}</TableCell>
                    <TableCell>{occurrence.trainerName}</TableCell>
                    <TableCell>{occurrence.customerName}</TableCell>
                    <TableCell>
                      <Badge className={occurrenceStatusClass(occurrence.status)}>{label(occurrence.status)}</Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => void changeOccurrenceStatus(occurrence, "completed")}>
                        <CheckCircle2 className="size-3" />
                        Done
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditOccurrence(occurrence)}>
                        <Pencil className="size-3" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void removeOccurrence(occurrence)}>
                        <Trash2 className="size-3" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && occurrences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-zinc-500">
                      No scheduled sessions in this month.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit session plan" : "Add session plan"}</DialogTitle>
            <DialogDescription>Plans track the commercial agreement and expected session package.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title" value={planForm.title} onChange={(title) => setPlanForm({ ...planForm, title })} />
            <SelectField label="Kind" value={planForm.sessionKind} values={trainingSessionKinds} onChange={(sessionKind) => setPlanForm({ ...planForm, sessionKind })} />
            <SelectField label="Trainer" value={planForm.trainer} values={trainers.map((trainer) => trainer.id)} getLabel={(id) => trainers.find((trainer) => trainer.id === id)?.fullName ?? id} onChange={(trainer) => setPlanForm({ ...planForm, trainer })} />
            <SelectField label="Gym goer" value={planForm.customer} values={customers.map((customer) => customer.id)} getLabel={(id) => customers.find((customer) => customer.id === id)?.fullName ?? id} onChange={(customer) => setPlanForm({ ...planForm, customer })} />
            <NumberField label="Total sessions" value={planForm.totalSessions} onChange={(totalSessions) => setPlanForm({ ...planForm, totalSessions })} />
            <NumberField label="Duration minutes" value={planForm.defaultDurationMin} onChange={(defaultDurationMin) => setPlanForm({ ...planForm, defaultDurationMin })} />
            <SelectField label="Status" value={planForm.status} values={trainingSessionPlanStatuses} onChange={(status) => setPlanForm({ ...planForm, status })} />
            <SelectField label="Payment status" value={planForm.paymentStatus} values={trainingSessionPaymentStatuses} onChange={(paymentStatus) => setPlanForm({ ...planForm, paymentStatus })} />
            <NumberField label="Payment amount" value={planForm.paymentAmount} onChange={(paymentAmount) => setPlanForm({ ...planForm, paymentAmount })} />
            <NumberField label="Amount paid" value={planForm.amountPaid} onChange={(amountPaid) => setPlanForm({ ...planForm, amountPaid })} />
            <Field label="Currency" value={planForm.paymentCurrency} onChange={(paymentCurrency) => setPlanForm({ ...planForm, paymentCurrency: paymentCurrency.toUpperCase().slice(0, 3) })} />
            <Field label="Payment provider" value={planForm.paymentProvider} onChange={(paymentProvider) => setPlanForm({ ...planForm, paymentProvider })} />
            <Field label="Payment reference" value={planForm.externalPaymentReference} onChange={(externalPaymentReference) => setPlanForm({ ...planForm, externalPaymentReference })} />
            <Field label="Paid at" type="datetime-local" value={planForm.paidAt ? toInputDateTime(planForm.paidAt) : ""} onChange={(paidAt) => setPlanForm({ ...planForm, paidAt: paidAt ? fromInputDateTime(paidAt) : null })} />
            <Field label="Starts on" type="date" value={planForm.startsOn ?? ""} onChange={(startsOn) => setPlanForm({ ...planForm, startsOn: startsOn || null })} />
            <Field label="Ends on" type="date" value={planForm.endsOn ?? ""} onChange={(endsOn) => setPlanForm({ ...planForm, endsOn: endsOn || null })} />
            <div className="space-y-2 md:col-span-2">
              <Label>Details</Label>
              <Textarea value={planForm.details} onChange={(event) => setPlanForm({ ...planForm, details: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Payment notes</Label>
              <Textarea value={planForm.paymentNotes} onChange={(event) => setPlanForm({ ...planForm, paymentNotes: event.target.value })} />
            </div>
          </div>
          <Button onClick={() => void savePlan()} disabled={!planForm.title || !planForm.trainer || !planForm.customer}>
            {editingPlan ? "Save changes" : "Create plan"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isOccurrenceOpen} onOpenChange={setIsOccurrenceOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingOccurrence ? "Edit scheduled session" : "Schedule session"}</DialogTitle>
            <DialogDescription>Occurrences are the individual calendar appointments inside a plan.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Plan" value={occurrenceForm.plan} values={plans.map((plan) => plan.id)} getLabel={(id) => plans.find((plan) => plan.id === id)?.title ?? id} onChange={(plan) => setOccurrenceForm({ ...occurrenceForm, plan })} />
            <NumberField label="Sequence" value={occurrenceForm.sequenceNumber} onChange={(sequenceNumber) => setOccurrenceForm({ ...occurrenceForm, sequenceNumber })} />
            <Field label="Starts at" type="datetime-local" value={toInputDateTime(occurrenceForm.startsAt)} onChange={(startsAt) => setOccurrenceForm({ ...occurrenceForm, startsAt: fromInputDateTime(startsAt) })} />
            <Field label="Ends at" type="datetime-local" value={toInputDateTime(occurrenceForm.endsAt)} onChange={(endsAt) => setOccurrenceForm({ ...occurrenceForm, endsAt: fromInputDateTime(endsAt) })} />
            <SelectField label="Status" value={occurrenceForm.status} values={trainingSessionOccurrenceStatuses} onChange={(status) => setOccurrenceForm({ ...occurrenceForm, status })} />
            <Field label="Location" value={occurrenceForm.locationName} onChange={(locationName) => setOccurrenceForm({ ...occurrenceForm, locationName })} />
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={occurrenceForm.notes} onChange={(event) => setOccurrenceForm({ ...occurrenceForm, notes: event.target.value })} />
            </div>
          </div>
          <Button onClick={() => void saveOccurrence()} disabled={!occurrenceForm.plan || !occurrenceForm.startsAt || !occurrenceForm.endsAt}>
            {editingOccurrence ? "Save changes" : "Schedule"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate recurring sessions</DialogTitle>
            <DialogDescription>Create multiple scheduled sessions from the selected plan.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Start date" type="date" value={generateForm.startDate} onChange={(startDate) => setGenerateForm({ ...generateForm, startDate })} />
            <Field label="Start time" type="time" value={generateForm.startTime} onChange={(startTime) => setGenerateForm({ ...generateForm, startTime })} />
            <NumberField label="Count" value={generateForm.count ?? 1} onChange={(count) => setGenerateForm({ ...generateForm, count })} />
            <NumberField label="Duration minutes" value={generateForm.durationMin ?? generatePlan?.defaultDurationMin ?? 60} onChange={(durationMin) => setGenerateForm({ ...generateForm, durationMin })} />
            <Field label="Weekdays" value={generateForm.weekdays.join(",")} onChange={(weekdays) => setGenerateForm({ ...generateForm, weekdays: weekdays.split(",").map((day) => Number(day.trim())).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) })} />
            <Field label="Location" value={generateForm.locationName} onChange={(locationName) => setGenerateForm({ ...generateForm, locationName })} />
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={generateForm.notes} onChange={(event) => setGenerateForm({ ...generateForm, notes: event.target.value })} />
            </div>
          </div>
          <Button onClick={() => void generateOccurrences()} disabled={!generatePlan || generateForm.weekdays.length === 0}>
            Generate sessions
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label} type="number" value={String(value)} onChange={(nextValue) => onChange(Number(nextValue))} />
  );
}

function SelectField<T extends string>({
  label: fieldLabel,
  value,
  values,
  onChange,
  getLabel = label,
}: {
  label: string;
  value: T;
  values: readonly T[];
  onChange: (value: T) => void;
  getLabel?: (value: T) => string;
}) {
  return (
    <div className="space-y-2">
      <Label>{fieldLabel}</Label>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {values.map((item) => (
            <SelectItem key={item} value={item}>
              {getLabel(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
