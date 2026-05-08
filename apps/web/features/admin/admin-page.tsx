import { ShieldCheck, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminCustomersPanel } from "./components/admin-customers-panel";
import { AdminEmployeesPanel } from "./components/admin-employees-panel";
import { ProgramsPanel } from "@/features/programs/components/programs-panel";
import { listCustomers } from "@/lib/api/admin";

export function AdminPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/70 bg-card/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                  <ShieldCheck className="size-5" />
                </div>
                <Badge variant="secondary">Admin panel</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
                Organization administration
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Manage employees, roles, user profiles, and account state for
                your organization.
              </p>
            </div>
            <Card className="md:w-80">
              <CardHeader className="pb-2">
                <CardDescription>Authorization model</CardDescription>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UsersRound className="size-4" />
                  Supabase JWT + organization admin
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Admin access is scoped to the current staff member&apos;s
                organization.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="customers">Users</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
          </TabsList>
          <TabsContent value="employees" className="mt-4">
            <AdminEmployeesPanel />
          </TabsContent>
          <TabsContent value="customers" className="mt-4">
            <AdminCustomersPanel />
          </TabsContent>
          <TabsContent value="programs" className="mt-4">
            <ProgramsPanel
              description="Create, edit, and assign structured training programs."
              listGymGoers={listCustomers}
            />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
