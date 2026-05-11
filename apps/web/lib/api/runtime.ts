const LOCAL_API_BASE_URL = "http://localhost:8000/api";

export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_API_BASE_URL;
  }

  return "";
}

export function getApiBaseUrlOrThrow() {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    throw new Error("API base URL is not configured for this deployment.");
  }

  return apiBaseUrl;
}
