"use client";

import { memberTrainingProgramAssignmentSchema } from "@repo/domain";

import { apiRequest, toCamelCaseRecord } from "@/lib/api/client";

function request<T>(path: string, init: RequestInit = {}) {
  return apiRequest<T>(path, init, "Member API");
}

export async function listMyProgramAssignments(params: { status?: string } = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) {
    searchParams.set("status", params.status);
  }
  const suffix = searchParams.size ? `?${searchParams.toString()}` : "";
  const data = await request<Record<string, unknown>[]>(`/app/program-assignments/${suffix}`);
  return data.map((item) => memberTrainingProgramAssignmentSchema.parse(toCamelCaseRecord(item)));
}
