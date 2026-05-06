"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  UserCog,
  UsersRound,
} from "lucide-react";
import { demoServices } from "@repo/domain/services";
import { managerDashboardMetrics } from "@repo/domain/dashboard";

import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createManagerStaff,
  createManagerTrainer,
  deactivateManagerStaff,
  deactivateManagerTrainer,
  listManagerStaff,
  listManagerTrainers,
  updateManagerStaff,
  updateManagerTrainer,
} from "@/lib/api/manager";
import { ManagerGymGoersPanel } from "./panels/manager-gym-goers-panel";
import { ManagerSessionsPanel } from "./panels/manager-sessions-panel";
import { ManagerStaffPanel } from "./panels/manager-staff-panel";

const trainerPrograms = [
  { trainer: "Mert Kaya", program: "Strength foundation", members: 12, status: "On track", nextReview: "2026-05-08" },
  { trainer: "Aylin Demir", program: "Mobility rebuild", members: 7, status: "Needs review", nextReview: "2026-05-06" },
  { trainer: "Zeynep Arslan", program: "Swim conditioning", members: 9, status: "Updated", nextReview: "2026-05-10" },
];

const activity = [
  "Mert updated 4 member plans",
  "Aylin requested review for mobility template",
  "Zeynep completed 6 weekly check-ins",
];

const sections = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "staff", label: "Staff", icon: UserCog },
  { id: "trainers", label: "Trainers", icon: Dumbbell },
  { id: "gym-goers", label: "Gym goers", icon: UsersRound },
  { id: "sessions", label: "Sessions", icon: CalendarDays },
] as const;

type SectionId = (typeof sections)[number]["id"];

export default function ManagerPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const activeMeta = sections.find((section) => section.id === activeSection) ?? sections[0];

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-zinc-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-zinc-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-r lg:border-b-0">
          <div className="flex h-full flex-col gap-6 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-cyan-800 text-white">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Manager panel</p>
                <p className="text-xs text-zinc-500">Organization operations</p>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = section.id === activeSection;
                return (
                  <Button
                    key={section.id}
                    variant={isActive ? "default" : "ghost"}
                    className="h-10 justify-start rounded-md whitespace-nowrap"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon className="size-4" />
                    {section.label}
                  </Button>
                );
              })}
            </nav>

            <div className="mt-auto hidden rounded-md border border-zinc-200 bg-[#fbfaf7] p-3 text-sm text-zinc-600 lg:block">
              <p className="font-medium text-zinc-950">Access scope</p>
              <p className="mt-1">Managers can manage staff, trainers, and gym goer records inside their organization.</p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm">
                  <Link href="/profile">Profile</Link>
                </Button>
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <header className="border-b border-zinc-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-md">
                  {activeMeta.label}
                </Badge>
                <Badge variant="outline" className="rounded-md">
                  CRUD enabled
                </Badge>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">Manager operations</h1>
                  <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                    Review operational health and manage staff, personal trainers, and gym goer records.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {activeSection === "overview" ? <OverviewPanel /> : null}
            {activeSection === "staff" ? (
              <ManagerStaffPanel
                title="Staff"
                description="List, add, edit, and remove staff members across operational roles."
                createLabel="Add staff"
                emptyLabel="No active staff found."
                listRecords={listManagerStaff}
                createRecord={createManagerStaff}
                updateRecord={updateManagerStaff}
                deactivateRecord={deactivateManagerStaff}
              />
            ) : null}
            {activeSection === "trainers" ? (
              <ManagerStaffPanel
                title="Trainers"
                description="List, add, edit, and remove personal trainers."
                createLabel="Add trainer"
                emptyLabel="No active trainers found."
                fixedRole="personal_trainer"
                listRecords={listManagerTrainers}
                createRecord={createManagerTrainer}
                updateRecord={updateManagerTrainer}
                deactivateRecord={deactivateManagerTrainer}
              />
            ) : null}
            {activeSection === "gym-goers" ? <ManagerGymGoersPanel /> : null}
            {activeSection === "sessions" ? <ManagerSessionsPanel /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function OverviewPanel() {
  const trainerServices = demoServices.filter((service) => service.requiresStaff);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {managerDashboardMetrics.map((metric) => (
          <Card key={metric.label} className="rounded-md border-zinc-200 shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="rounded-md">
                {metric.delta}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <Card className="rounded-md border-zinc-200 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="size-5 text-cyan-800" />
              Trainer programs
            </CardTitle>
            <CardDescription>Program ownership, member count, and upcoming review windows.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainerPrograms.map((program) => (
                  <TableRow key={`${program.trainer}-${program.program}`}>
                    <TableCell className="font-medium">{program.trainer}</TableCell>
                    <TableCell>{program.program}</TableCell>
                    <TableCell>{program.members}</TableCell>
                    <TableCell>
                      <Badge variant={program.status === "Needs review" ? "destructive" : "secondary"} className="rounded-md">
                        {program.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{program.nextReview}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-md border-zinc-200 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5 text-cyan-800" />
                Staff-backed services
              </CardTitle>
              <CardDescription>Services currently requiring staff assignment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {trainerServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between border-b border-zinc-200 pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-zinc-600">{service.durationMin} min session</p>
                  </div>
                  <Badge variant="outline" className="rounded-md">
                    {service.kind.replaceAll("_", " ")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-md border-zinc-200 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5 text-emerald-700" />
                Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {activity.map((item) => (
                <div key={item}>
                  <div className="flex gap-3">
                    <TrendingUp className="mt-0.5 size-4 text-emerald-700" />
                    <p>{item}</p>
                  </div>
                  <Separator className="mt-3" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
