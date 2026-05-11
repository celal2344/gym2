"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getApiBaseUrlOrThrow } from "@/lib/api/runtime";

type ApiError = {
  code?: string;
  message?: string;
  details?: unknown;
};

export function toSnakeCaseRecord(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toSnakeCaseRecord);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [
          key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
          toSnakeCaseRecord(entryValue),
        ]),
    );
  }

  return value;
}

export function toCamelCaseRecord(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toCamelCaseRecord);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        toCamelCaseRecord(entryValue),
      ]),
    );
  }

  return value;
}

export async function getAccessToken() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }

  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, label = "API") {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("You need to log in before using this workspace.");
  }

  const apiBaseUrl = getApiBaseUrlOrThrow();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(error.message ?? `${label} request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function jsonBody(value: unknown) {
  return JSON.stringify(toSnakeCaseRecord(value));
}
