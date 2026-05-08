"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import {
  createManagerStaff,
  createManagerTrainer,
  deactivateManagerStaff,
  deactivateManagerTrainer,
  listManagerStaff,
  listManagerGymGoers,
  listManagerTrainers,
  updateManagerStaff,
  updateManagerTrainer,
} from "@/lib/api/manager";
import { managerSections, type ManagerSectionId } from "./constants";
import { ManagerGymGoersPanel } from "./components/manager-gym-goers-panel";
import { ManagerOverviewPanel } from "./components/manager-overview-panel";
import { ManagerSessionsPanel } from "./components/manager-sessions-panel";
import { ManagerStaffPanel } from "./components/manager-staff-panel";
import { ProgramsPanel } from "@/features/programs/components/programs-panel";

export function ManagerPage() {
  const [activeSection, setActiveSection] = useState<ManagerSectionId>("overview");
  const activeMeta = managerSections.find((section) => section.id === activeSection) ?? managerSections[0];

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
              {managerSections.map((section) => {
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
            {activeSection === "overview" ? <ManagerOverviewPanel /> : null}
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
            {activeSection === "programs" ? (
              <ProgramsPanel
                description="Edit program shells and assign them to gym goers."
                listGymGoers={listManagerGymGoers}
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
