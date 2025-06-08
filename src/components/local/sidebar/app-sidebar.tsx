"use client";

import * as React from "react";

import { NavMain } from "@/components/local/sidebar/nav-main";
import { NavUser } from "@/components/local/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Circle,
  GroupIcon,
  LayoutDashboard,
  ListOrdered,
  Users,
  User,
  Settings,
  ImageIcon,
  LucideIcon,
} from "lucide-react";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Teams",
      url: "/teams",
      icon: ListOrdered,
    },
    {
      title: "Players",
      url: "/players",
      icon: Users,
    },
    {
      title: "Leagues",
      url: "/leagues",
      icon: GroupIcon,
    },
    {
      title: "Venues",
      url: "/venues",
      icon: function VenuesIcon(props: any) {
        return (
          <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M3 21V4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v17' />
            <path d='M21 21H3' />
            <path d='M9 8h1' />
            <path d='M9 12h1' />
            <path d='M9 16h1' />
            <path d='M14 8h1' />
            <path d='M14 12h1' />
            <path d='M14 16h1' />
          </svg>
        );
      } as unknown as LucideIcon,
    },
    {
      title: "Referees",
      url: "/referees",
      icon: User,
    },
    {
      title: "Carousel",
      url: "/carousel",
      icon: ImageIcon,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className='data-[slot=sidebar-menu-button]:!p-1.5'
            >
              <a href='/dashboard'>
                <Circle className='!size-5' />
                <span className='text-base font-semibold'>UPL</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
