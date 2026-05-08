import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import {
  isSupabaseConfigured,
  isUnconfiguredProtectedRouteBypassEnabled,
} from "@/lib/supabase/runtime";

const protectedPrefixes = ["/admin", "/manager", "/trainer", "/profile", "/app"];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const pathPanelMap = {
  "/admin": "admin",
  "/manager": "manager",
  "/trainer": "trainer",
  "/app": "app",
  "/profile": "profile",
} as const;

export async function proxy(request: NextRequest) {
  const isProtectedPath = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  if (!isSupabaseConfigured()) {
    if (isUnconfiguredProtectedRouteBypassEnabled()) {
      return NextResponse.next();
    }

    return redirectToLogin(request, "auth-unavailable");
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  let user = null;
  let session = null;

  try {
    const [{ data: userData }, { data: sessionData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);
    user = userData.user;
    session = sessionData.session;
  } catch {
    return redirectToLogin(request, "service-unavailable");
  }

  if (!user || !session?.access_token) {
    return redirectToLogin(request);
  }

  const requiredPanel = Object.entries(pathPanelMap).find(([prefix]) => request.nextUrl.pathname.startsWith(prefix))?.[1];
  if (requiredPanel && requiredPanel !== "profile") {
    let profileResponse: Response;

    try {
      profileResponse = await fetch(`${API_BASE_URL}/auth/me/`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });
    } catch {
      return redirectToLogin(request, "service-unavailable");
    }

    if (profileResponse.status === 401 || profileResponse.status === 403) {
      return redirectToLogin(request);
    }

    if (!profileResponse.ok) {
      return redirectToLogin(request, "service-unavailable");
    }

    const profile = (await profileResponse.json().catch(() => null)) as
      | { allowed_panels?: string[] }
      | null;

    if (!profile) {
      return redirectToLogin(request, "service-unavailable");
    }

    if (!profile.allowed_panels?.includes(requiredPanel)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/profile";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

function redirectToLogin(request: NextRequest, reason?: "auth-unavailable" | "service-unavailable") {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.searchParams.set("next", request.nextUrl.pathname);
  if (reason) {
    redirectUrl.searchParams.set("reason", reason);
  }
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/trainer/:path*", "/profile/:path*", "/app/:path*"],
};
