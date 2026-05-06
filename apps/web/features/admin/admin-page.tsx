import { ShieldCheck, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminCustomersPanel } from "./components/admin-customers-panel";
import { AdminEmployeesPanel } from "./components/admin-employees-panel";

export function AdminPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-md bg-zinc-950 text-white">
                  <ShieldCheck className="size-5" />
                </div>
                <Badge variant="secondary">Admin panel</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">Organization administration</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                Manage employees, roles, user profiles, and account state for your organization.
              </p>
            </div>
            <Card className="rounded-md md:w-80">
              <CardHeader className="pb-2">
                <CardDescription>Authorization model</CardDescription>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UsersRound className="size-4" />
                  Supabase JWT + organization admin
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-600">
                Admin access is scoped to the current staff member&apos;s organization.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-md">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="customers">Users</TabsTrigger>
          </TabsList>
          <TabsContent value="employees" className="mt-4">
            <AdminEmployeesPanel />
          </TabsContent>
          <TabsContent value="customers" className="mt-4">
            <AdminCustomersPanel />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
