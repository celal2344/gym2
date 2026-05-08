"use client";

import {
  trainingProgramAssignmentCreateSchema,
  trainingProgramAssignmentSchema,
  trainingProgramCreateSchema,
  trainingProgramSchema,
  type TrainingProgram,
  type TrainingProgramAssignment,
  type TrainingProgramAssignmentCreate,
  type TrainingProgramCreate,
} from "@repo/domain";

import { apiRequest, jsonBody, toCamelCaseRecord } from "@/lib/api/client";

function request<T>(path: string, init: RequestInit = {}) {
  return apiRequest<T>(path, init, "Program API");
}

export async function listTrainingPrograms(params: { status?: string } = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) {
    searchParams.set("status", params.status);
  }
  const suffix = searchParams.size ? `?${searchParams}` : "";
  const data = await request<Record<string, unknown>[]>(`/programs/${suffix}`);
  return data.map((item) => trainingProgramSchema.parse(toCamelCaseRecord(item)));
}

export async function createTrainingProgram(payload: TrainingProgramCreate) {
  const parsed = trainingProgramCreateSchema.parse(payload);
  const data = await request<Record<string, unknown>>("/programs/", {
    method: "POST",
    body: jsonBody(parsed),
  });
  return trainingProgramSchema.parse(toCamelCaseRecord(data));
}

export async function updateTrainingProgram(id: string, payload: Partial<TrainingProgramCreate>) {
  const data = await request<Record<string, unknown>>(`/programs/${id}/`, {
    method: "PATCH",
    body: jsonBody(payload),
  });
  return trainingProgramSchema.parse(toCamelCaseRecord(data));
}

export async function archiveTrainingProgram(program: TrainingProgram) {
  const data = await request<Record<string, unknown>>(`/programs/${program.id}/`, {
    method: "DELETE",
  });
  return trainingProgramSchema.parse(toCamelCaseRecord(data));
}

export async function listTrainingProgramAssignments(params: { program?: string; customer?: string; status?: string } = {}) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }
  const suffix = searchParams.size ? `?${searchParams}` : "";
  const data = await request<Record<string, unknown>[]>(`/program-assignments/${suffix}`);
  return data.map((item) => trainingProgramAssignmentSchema.parse(toCamelCaseRecord(item)));
}

export async function createTrainingProgramAssignment(payload: TrainingProgramAssignmentCreate) {
  const parsed = trainingProgramAssignmentCreateSchema.parse(payload);
  const data = await request<Record<string, unknown>>("/program-assignments/", {
    method: "POST",
    body: jsonBody(parsed),
  });
  return trainingProgramAssignmentSchema.parse(toCamelCaseRecord(data));
}

export async function updateTrainingProgramAssignment(id: string, payload: Partial<TrainingProgramAssignmentCreate>) {
  const data = await request<Record<string, unknown>>(`/program-assignments/${id}/`, {
    method: "PATCH",
    body: jsonBody(payload),
  });
  return trainingProgramAssignmentSchema.parse(toCamelCaseRecord(data));
}

export async function cancelTrainingProgramAssignment(assignment: TrainingProgramAssignment) {
  const data = await request<Record<string, unknown>>(`/program-assignments/${assignment.id}/`, {
    method: "DELETE",
  });
  return trainingProgramAssignmentSchema.parse(toCamelCaseRecord(data));
}
