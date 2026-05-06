"use client";

import { authSessionSchema, type AuthSession } from "@repo/domain/auth";

import { apiRequest, toCamelCaseRecord } from "@/lib/api/client";

export async function getCurrentProfile(): Promise<AuthSession> {
  const data = await apiRequest<Record<string, unknown>>("/auth/me/", {}, "Profile API");
  return authSessionSchema.parse(toCamelCaseRecord(data));
}

export function defaultPanelPath(profile: AuthSession) {
  if (profile.allowedPanels.includes("admin")) {
    return "/admin";
  }
  if (profile.allowedPanels.includes("manager")) {
    return "/manager";
  }
  if (profile.allowedPanels.includes("trainer")) {
    return "/trainer";
  }
  if (profile.allowedPanels.includes("app")) {
    return "/app";
  }
  return "/profile";
}
