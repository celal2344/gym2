"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/runtime";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function logout() {
    if (isSupabaseConfigured()) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut().catch(() => undefined);
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" className={className} onClick={() => void logout()}>
      <LogOut className="size-4" />
      Logout
    </Button>
  );
}
