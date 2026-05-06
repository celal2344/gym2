import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  if (!isProtectedPath || !isSupabaseConfigured) {
    return NextResponse.next();
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user || !session?.access_token) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const requiredPanel = Object.entries(pathPanelMap).find(([prefix]) => request.nextUrl.pathname.startsWith(prefix))?.[1];
  if (requiredPanel && requiredPanel !== "profile") {
    const profileResponse = await fetch(`${API_BASE_URL}/auth/me/`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const profile = (await profileResponse.json()) as { allowed_panels?: string[] };
    if (!profile.allowed_panels?.includes(requiredPanel)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/profile";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/trainer/:path*", "/profile/:path*", "/app/:path*"],
};
