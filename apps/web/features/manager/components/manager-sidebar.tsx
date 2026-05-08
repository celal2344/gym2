"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { managerSections, type ManagerSectionId } from "../constants";

type ManagerSidebarProps = {
  activeSection: ManagerSectionId;
  onSectionChange: (section: ManagerSectionId) => void;
};

export function ManagerSidebar({
  activeSection,
  onSectionChange,
}: ManagerSidebarProps) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Manager panel"
              className="h-12"
            >
              <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                <ClipboardList className="size-5" />
              </div>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">
                  Manager panel
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Organization operations
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managerSections.map((section) => {
                const Icon = section.icon;
                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      isActive={section.id === activeSection}
                      tooltip={section.label}
                      onClick={() => onSectionChange(section.id)}
                    >
                      <Icon className="size-4" />
                      <span>{section.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Profile"
              render={<Link href="/profile" />}
            >
              <span>Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <LogoutButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
