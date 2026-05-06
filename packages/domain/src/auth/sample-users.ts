import type { AppRole } from "./roles";

export type SampleUser = {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
  panelPath: string;
};

export const sampleUsers: SampleUser[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    email: "admin@gymops.dev",
    password: "GymOpsAdmin123!",
    fullName: "Admin User",
    role: "admin",
    panelPath: "/admin",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    email: "manager@gymops.dev",
    password: "GymOpsManager123!",
    fullName: "Manager User",
    role: "manager",
    panelPath: "/manager",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    email: "trainer@gymops.dev",
    password: "GymOpsTrainer123!",
    fullName: "Trainer User",
    role: "personal_trainer",
    panelPath: "/trainer",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    email: "member@gymops.dev",
    password: "GymOpsMember123!",
    fullName: "Member User",
    role: "user",
    panelPath: "/app",
  },
];
