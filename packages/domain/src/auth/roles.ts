export const appRoles = ["admin", "manager", "personal_trainer", "user"] as const;
export const staffRoles = ["admin", "manager", "personal_trainer", "front_desk", "therapist"] as const;

export type AppRole = (typeof appRoles)[number];
export type StaffRole = (typeof staffRoles)[number];
