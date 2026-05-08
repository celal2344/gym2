"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dumbbell, LogIn, UserRound } from "lucide-react";
import { sampleUsers } from "@repo/domain/auth";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultPanelPath, getCurrentProfile } from "@/lib/api/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/runtime";

const defaultSampleUser = sampleUsers.at(-1);

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const reason = searchParams.get("reason");
  const [email, setEmail] = useState(defaultSampleUser?.email ?? "");
  const [password, setPassword] = useState(defaultSampleUser?.password ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabaseConfigured = isSupabaseConfigured();

  const selectedSampleUser = useMemo(
    () => sampleUsers.find((user) => user.email === email),
    [email],
  );

  async function login() {
    setError(null);
    setIsLoading(true);
    try {
      if (!supabaseConfigured) {
        throw new Error("Supabase public environment variables are missing.");
      }

      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        throw signInError;
      }

      const profile = await getCurrentProfile();
      router.replace(nextPath || defaultPanelPath(profile));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function selectSampleUser(sampleEmail: string) {
    const user = sampleUsers.find((item) => item.email === sampleEmail);
    if (!user) {
      return;
    }
    setEmail(user.email);
    setPassword(user.password);
    setError(null);
  }

  return (
    <LoginShell
      email={email}
      password={password}
      error={error}
      isLoading={isLoading}
      isSupabaseConfigured={supabaseConfigured}
      reason={reason}
      selectedSampleUserPanelPath={selectedSampleUser?.panelPath}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSampleUserSelect={selectSampleUser}
      onLogin={() => void login()}
    />
  );
}

function LoginShell({
  email = defaultSampleUser?.email ?? "",
  password = defaultSampleUser?.password ?? "",
  error = null,
  isLoading = false,
  isSupabaseConfigured = true,
  reason = null,
  selectedSampleUserPanelPath,
  onEmailChange,
  onPasswordChange,
  onSampleUserSelect,
  onLogin,
}: {
  email?: string;
  password?: string;
  error?: string | null;
  isLoading?: boolean;
  isSupabaseConfigured?: boolean;
  reason?: string | null;
  selectedSampleUserPanelPath?: string;
  onEmailChange?: (value: string) => void;
  onPasswordChange?: (value: string) => void;
  onSampleUserSelect?: (email: string) => void;
  onLogin?: () => void;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid min-h-screen max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <Dumbbell className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">GymOps</p>
              <p className="text-xs text-muted-foreground">
                Secure role-based access
              </p>
            </div>
          </div>
          <h1 className="mt-6 max-w-xl text-3xl font-semibold tracking-normal sm:text-4xl">
            Sign in to your operations workspace.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Supabase handles credentials. Django resolves your organization,
            role, and permitted panels after login.
          </p>
        </div>

        <div className="flex items-center">
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Use one of the sample users or a Supabase user linked to a
                    GymOps profile.
                  </CardDescription>
                </div>
                <Badge variant="secondary">Supabase</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {!isSupabaseConfigured ? (
                <Alert variant="destructive">
                  <AlertTitle>Supabase is not configured</AlertTitle>
                  <AlertDescription>
                    Set `NEXT_PUBLIC_SUPABASE_URL` and
                    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` before logging in.
                  </AlertDescription>
                </Alert>
              ) : null}
              {reason === "service-unavailable" ? (
                <Alert variant="destructive">
                  <AlertTitle>Authentication service unavailable</AlertTitle>
                  <AlertDescription>
                    GymOps could not verify your access right now. Try again
                    after the auth service recovers.
                  </AlertDescription>
                </Alert>
              ) : null}
              {reason === "auth-unavailable" ? (
                <Alert variant="destructive">
                  <AlertTitle>Protected workspace unavailable</AlertTitle>
                  <AlertDescription>
                    This web app is missing its Supabase runtime configuration,
                    so protected panels stay locked until auth is configured.
                  </AlertDescription>
                </Alert>
              ) : null}
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Login failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                {sampleUsers.map((user) => (
                  <Button
                    key={user.id}
                    type="button"
                    variant={user.email === email ? "default" : "outline"}
                    className="h-auto justify-start py-3"
                    onClick={() => onSampleUserSelect?.(user.email)}
                  >
                    <UserRound className="size-4" />
                    <span className="flex flex-col items-start">
                      <span>{user.role.replaceAll("_", " ")}</span>
                      <span className="text-xs opacity-70">{user.email}</span>
                    </span>
                  </Button>
                ))}
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(event) => onEmailChange?.(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => onPasswordChange?.(event.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={onLogin}
                disabled={isLoading || !isSupabaseConfigured || !email || !password}
              >
                <LogIn className="size-4" />
                {isLoading ? "Signing in" : "Sign in"}
              </Button>

              {selectedSampleUserPanelPath ? (
                <p className="text-xs text-muted-foreground">
                  Sample route after login: {selectedSampleUserPanelPath}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null;
  }

  return nextPath;
}
