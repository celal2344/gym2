import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { MemberProgramsPanel } from "./components/member-programs-panel";

export default function UserAppPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">Member workspace</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                Review assigned programs and upcoming self-service workflows.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Link href="/profile">Profile</Link>
              </Button>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <MemberProgramsPanel />
      </div>
    </main>
  );
}
