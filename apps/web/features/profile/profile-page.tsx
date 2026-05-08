"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ShieldCheck, UserRound } from "lucide-react";
import type { AuthSession } from "@repo/domain/auth";

import { LogoutButton } from "@/components/auth/logout-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { defaultPanelPath, getCurrentProfile } from "@/lib/api/auth";

export default function ProfilePage() {
  const [profile, setProfile] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      setError(null);
      try {
        setProfile(await getCurrentProfile());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load profile.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/70 bg-card/90">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="secondary">Profile</Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal">
                Account profile
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your Supabase identity and GymOps authorization context.
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_0.7fr] lg:px-8">
        {error ? (
          <Alert variant="destructive" className="lg:col-span-2">
            <AlertTitle>Profile unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <Card className="lg:col-span-2">
            <CardContent className="py-8 text-sm text-muted-foreground">
              Loading profile...
            </CardContent>
          </Card>
        ) : null}

        {profile ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="size-5 text-emerald-700" />
                  Identity
                </CardTitle>
                <CardDescription>
                  Resolved from the current Supabase session.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ProfileRow label="Name" value={profile.profile.fullName} />
                <ProfileRow
                  label="Email"
                  value={profile.profile.email || "-"}
                />
                <ProfileRow
                  label="Phone"
                  value={profile.profile.phone || "-"}
                />
                <ProfileRow
                  label="Role"
                  value={profile.role.replaceAll("_", " ")}
                />
                <ProfileRow
                  label="Supabase user"
                  value={profile.profile.supabaseUserId ?? "-"}
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="size-5 text-cyan-800" />
                    Organization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <ProfileRow
                    label="Name"
                    value={profile.organization?.name ?? "-"}
                  />
                  <ProfileRow
                    label="Slug"
                    value={profile.organization?.slug ?? "-"}
                  />
                  {profile.staffMember ? (
                    <ProfileRow
                      label="Job title"
                      value={profile.staffMember.jobTitle || "-"}
                    />
                  ) : null}
                  {profile.customer ? (
                    <ProfileRow
                      label="Membership"
                      value={profile.customer.membershipCode}
                    />
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-emerald-700" />
                    Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {profile.allowedPanels.map((panel) => (
                      <Badge key={panel} variant="secondary">
                        {panel}
                      </Badge>
                    ))}
                  </div>
                  <Link
                    className={buttonVariants()}
                    href={defaultPanelPath(profile)}
                  >
                    Open default panel
                  </Link>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-3 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[70%] break-words text-right font-medium">
        {value}
      </span>
    </div>
  );
}
