import { CalendarDays, ClipboardList, CreditCard, DoorOpen, Dumbbell, LayoutDashboard, UserCog, UsersRound } from "lucide-react";

export const managerSections = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "staff", label: "Staff", icon: UserCog },
  { id: "trainers", label: "Trainers", icon: Dumbbell },
  { id: "gym-goers", label: "Gym goers", icon: UsersRound },
  { id: "memberships", label: "Memberships", icon: CreditCard },
  { id: "check-ins", label: "Check-ins", icon: DoorOpen },
  { id: "sessions", label: "Sessions", icon: CalendarDays },
  { id: "programs", label: "Programs", icon: ClipboardList },
] as const;

export type ManagerSectionId = (typeof managerSections)[number]["id"];

export const trainerPrograms = [
  { trainer: "Mert Kaya", program: "Strength foundation", members: 12, status: "On track", nextReview: "2026-05-08" },
  { trainer: "Aylin Demir", program: "Mobility rebuild", members: 7, status: "Needs review", nextReview: "2026-05-06" },
  { trainer: "Zeynep Arslan", program: "Swim conditioning", members: 9, status: "Updated", nextReview: "2026-05-10" },
];

export const managerActivity = [
  "Mert updated 4 member plans",
  "Aylin requested review for mobility template",
  "Zeynep completed 6 weekly check-ins",
];
