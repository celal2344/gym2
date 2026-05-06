"use client";

import {
  customerCreateSchema,
  customerSchema,
  employeeCreateSchema,
  employeeSchema,
  type CustomerCreate,
  type CustomerRecord,
  type Employee,
  type EmployeeCreate,
} from "@repo/domain";

import { apiRequest, jsonBody, toCamelCaseRecord } from "@/lib/api/client";

function request<T>(path: string, init: RequestInit = {}) {
  return apiRequest<T>(path, init, "Admin API");
}

export async function listEmployees() {
  const data = await request<Record<string, unknown>[]>("/admin/employees/");
  return data.map((item) => employeeSchema.parse(toCamelCaseRecord(item)));
}

export async function createEmployee(payload: EmployeeCreate) {
  const parsed = employeeCreateSchema.parse(payload);
  const data = await request<Record<string, unknown>>("/admin/employees/", {
    method: "POST",
    body: jsonBody(parsed),
  });
  return employeeSchema.parse(toCamelCaseRecord(data));
}

export async function updateEmployee(id: string, payload: Partial<EmployeeCreate>) {
  const data = await request<Record<string, unknown>>(`/admin/employees/${id}/`, {
    method: "PATCH",
    body: jsonBody(payload),
  });
  return employeeSchema.parse(toCamelCaseRecord(data));
}

export async function deactivateEmployee(employee: Employee) {
  const data = await request<Record<string, unknown>>(`/admin/employees/${employee.id}/`, {
    method: "DELETE",
  });
  return employeeSchema.parse(toCamelCaseRecord(data));
}

export async function listCustomers() {
  const data = await request<Record<string, unknown>[]>("/admin/customers/");
  return data.map((item) => customerSchema.parse(toCamelCaseRecord(item)));
}

export async function createCustomer(payload: CustomerCreate) {
  const parsed = customerCreateSchema.parse(payload);
  const data = await request<Record<string, unknown>>("/admin/customers/", {
    method: "POST",
    body: jsonBody(parsed),
  });
  return customerSchema.parse(toCamelCaseRecord(data));
}

export async function updateCustomer(id: string, payload: Partial<CustomerCreate>) {
  const data = await request<Record<string, unknown>>(`/admin/customers/${id}/`, {
    method: "PATCH",
    body: jsonBody(payload),
  });
  return customerSchema.parse(toCamelCaseRecord(data));
}

export async function deactivateCustomer(customer: CustomerRecord) {
  const data = await request<Record<string, unknown>>(`/admin/customers/${customer.id}/`, {
    method: "DELETE",
  });
  return customerSchema.parse(toCamelCaseRecord(data));
}
