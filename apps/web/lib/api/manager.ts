"use client";

import {
  customerCreateSchema,
  customerSchema,
  employeeCreateSchema,
  employeeSchema,
  generateTrainingSessionOccurrencesSchema,
  trainingSessionOccurrenceCreateSchema,
  trainingSessionOccurrenceSchema,
  trainingSessionPlanCreateSchema,
  trainingSessionPlanSchema,
  type CustomerCreate,
  type CustomerRecord,
  type Employee,
  type EmployeeCreate,
  type GenerateTrainingSessionOccurrences,
  type TrainingSessionOccurrence,
  type TrainingSessionOccurrenceCreate,
  type TrainingSessionPlan,
  type TrainingSessionPlanCreate,
} from "@repo/domain";

import { apiRequest, jsonBody, toCamelCaseRecord } from "@/lib/api/client";

function request<T>(path: string, init: RequestInit = {}) {
  return apiRequest<T>(path, init, "Manager API");
}

async function listEmployees(path: string) {
  const data = await request<Record<string, unknown>[]>(path);
  return data.map((item) => employeeSchema.parse(toCamelCaseRecord(item)));
}

async function createEmployee(path: string, payload: EmployeeCreate) {
  const parsed = employeeCreateSchema.parse(payload);
  const data = await request<Record<string, unknown>>(path, {
    method: "POST",
    body: jsonBody(parsed),
  });
  return employeeSchema.parse(toCamelCaseRecord(data));
}

async function updateEmployee(path: string, id: string, payload: Partial<EmployeeCreate>) {
  const data = await request<Record<string, unknown>>(`${path}${id}/`, {
    method: "PATCH",
    body: jsonBody(payload),
  });
  return employeeSchema.parse(toCamelCaseRecord(data));
}

async function deactivateEmployee(path: string, employee: Employee) {
  const data = await request<Record<string, unknown>>(`${path}${employee.id}/`, {
    method: "DELETE",
  });
  return employeeSchema.parse(toCamelCaseRecord(data));
}

export function listManagerStaff() {
  return listEmployees("/manager/staff/");
}

export function createManagerStaff(payload: EmployeeCreate) {
  return createEmployee("/manager/staff/", payload);
}

export function updateManagerStaff(id: string, payload: Partial<EmployeeCreate>) {
  return updateEmployee("/manager/staff/", id, payload);
}

export function deactivateManagerStaff(employee: Employee) {
  return deactivateEmployee("/manager/staff/", employee);
}

export function listManagerTrainers() {
  return listEmployees("/manager/trainers/");
}

export function createManagerTrainer(payload: EmployeeCreate) {
  return createEmployee("/manager/trainers/", { ...payload, roleKind: "personal_trainer" });
}

export function updateManagerTrainer(id: string, payload: Partial<EmployeeCreate>) {
  return updateEmployee("/manager/trainers/", id, { ...payload, roleKind: "personal_trainer" });
}

export function deactivateManagerTrainer(employee: Employee) {
  return deactivateEmployee("/manager/trainers/", employee);
}

export async function listManagerGymGoers() {
  const data = await request<Record<string, unknown>[]>("/manager/gym-goers/");
  return data.map((item) => customerSchema.parse(toCamelCaseRecord(item)));
}

export async function createManagerGymGoer(payload: CustomerCreate) {
  const parsed = customerCreateSchema.parse(payload);
  const data = await request<Record<string, unknown>>("/manager/gym-goers/", {
    method: "POST",
    body: jsonBody(parsed),
  });
  return customerSchema.parse(toCamelCaseRecord(data));
}

export async function updateManagerGymGoer(id: string, payload: Partial<CustomerCreate>) {
  const data = await request<Record<string, unknown>>(`/manager/gym-goers/${id}/`, {
    method: "PATCH",
    body: jsonBody(payload),
  });
  return customerSchema.parse(toCamelCaseRecord(data));
}

export async function deactivateManagerGymGoer(customer: CustomerRecord) {
  const data = await request<Record<string, unknown>>(`/manager/gym-goers/${customer.id}/`, {
    method: "DELETE",
  });
  return customerSchema.parse(toCamelCaseRecord(data));
}

export async function listManagerSessionPlans(params: { trainer?: string; customer?: string; status?: string } = {}) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }
  const suffix = searchParams.size ? `?${searchParams.toString()}` : "";
  const data = await request<Record<string, unknown>[]>(`/manager/session-plans/${suffix}`);
  return data.map((item) => trainingSessionPlanSchema.parse(toCamelCaseRecord(item)));
}

export async function createManagerSessionPlan(payload: TrainingSessionPlanCreate) {
  const parsed = trainingSessionPlanCreateSchema.parse(payload);
  const data = await request<Record<string, unknown>>("/manager/session-plans/", {
    method: "POST",
    body: jsonBody(parsed),
  });
  return trainingSessionPlanSchema.parse(toCamelCaseRecord(data));
}

export async function updateManagerSessionPlan(id: string, payload: Partial<TrainingSessionPlanCreate>) {
  const data = await request<Record<string, unknown>>(`/manager/session-plans/${id}/`, {
    method: "PATCH",
    body: jsonBody(payload),
  });
  return trainingSessionPlanSchema.parse(toCamelCaseRecord(data));
}

export async function deactivateManagerSessionPlan(plan: TrainingSessionPlan) {
  return updateManagerSessionPlan(plan.id, { isActive: false, status: "cancelled" });
}

export async function listManagerSessionOccurrences(
  year: number,
  month: number,
  params: { trainer?: string; customer?: string } = {},
) {
  const searchParams = new URLSearchParams({ year: String(year), month: String(month) });
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }
  const data = await request<Record<string, unknown>[]>(`/manager/session-occurrences/calendar/?${searchParams}`);
  return data.map((item) => trainingSessionOccurrenceSchema.parse(toCamelCaseRecord(item)));
}

export async function createManagerSessionOccurrence(payload: TrainingSessionOccurrenceCreate) {
  const parsed = trainingSessionOccurrenceCreateSchema.parse(payload);
  const data = await request<Record<string, unknown>>("/manager/session-occurrences/", {
    method: "POST",
    body: jsonBody(parsed),
  });
  return trainingSessionOccurrenceSchema.parse(toCamelCaseRecord(data));
}

export async function updateManagerSessionOccurrence(id: string, payload: Partial<TrainingSessionOccurrenceCreate>) {
  const data = await request<Record<string, unknown>>(`/manager/session-occurrences/${id}/`, {
    method: "PATCH",
    body: jsonBody(payload),
  });
  return trainingSessionOccurrenceSchema.parse(toCamelCaseRecord(data));
}

export async function deleteManagerSessionOccurrence(occurrence: TrainingSessionOccurrence) {
  await request<Record<string, unknown>>(`/manager/session-occurrences/${occurrence.id}/`, {
    method: "DELETE",
  });
}

export async function generateManagerSessionOccurrences(planId: string, payload: GenerateTrainingSessionOccurrences) {
  const parsed = generateTrainingSessionOccurrencesSchema.parse(payload);
  const data = await request<Record<string, unknown>[]>(`/manager/session-plans/${planId}/generate-occurrences/`, {
    method: "POST",
    body: jsonBody(parsed),
  });
  return data.map((item) => trainingSessionOccurrenceSchema.parse(toCamelCaseRecord(item)));
}
