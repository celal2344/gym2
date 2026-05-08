"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import { ManagerCheckInsPanel } from "./components/manager-check-ins-panel";
import { ManagerMembershipsPanel } from "./components/manager-memberships-panel";
import { ManagerOverviewPanel } from "./components/manager-overview-panel";
import { ManagerSidebar } from "./components/manager-sidebar";
import { ManagerSessionsPanel } from "./components/manager-sessions-panel";
import { ManagerStaffPanel } from "./components/manager-staff-panel";
import { ProgramsPanel } from "@/features/programs/components/programs-panel";

export function ManagerPage() {
  const [activeSection, setActiveSection] =
    useState<ManagerSectionId>("overview");
  const activeMeta =
    managerSections.find((section) => section.id === activeSection) ??
    managerSections[0];

  return (
    <SidebarProvider>
      <ManagerSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <SidebarInset className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border/70 bg-card/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <Badge variant="secondary">{activeMeta.label}</Badge>
              </div>
              <SidebarTrigger className="hidden md:inline-flex" />
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Organization workspace
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                  Manager operations
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Review operational health and manage staff, memberships,
                  attendance, trainer sessions, and programs.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
          {activeSection === "memberships" ? <ManagerMembershipsPanel /> : null}
          {activeSection === "check-ins" ? <ManagerCheckInsPanel /> : null}
          {activeSection === "sessions" ? <ManagerSessionsPanel /> : null}
          {activeSection === "programs" ? (
            <ProgramsPanel
              description="Create, edit, and assign structured training programs."
              listGymGoers={listManagerGymGoers}
            />
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
