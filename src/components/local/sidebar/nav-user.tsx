"use client";

import {
  Avatar,
  AvatarFallback,
  // AvatarImage
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLogout } from "@/lib/firebaseQueries";
import useAuthStore from "@/lib/store";
import LoaderComponent from "@/app/loading";
import { LogOut, MoreVertical, UserCircle } from "lucide-react";

export function NavUser() {
  const { user, isLoading } = useAuthStore();
  const logoutMutation = useLogout();

  // Show a loading state or a fallback if user data isn't available yet.
  if (isLoading) {
    return <LoaderComponent />;
  }
  if (!user) {
    return <div>No user logged in</div>;
  }

  // Compute initials from the displayName; fallback to first letter of email.
  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
    : user.email
    ? user.email[0].toUpperCase()
    : "U";

  // Handle logout action.
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <Avatar className='h-8 w-8 rounded-lg grayscale'>
                <AvatarFallback>{initials}</AvatarFallback>

                {/* {user.photoURL ? (
                  <AvatarImage
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                  />
                ) : (
                  <AvatarFallback>{initials}</AvatarFallback>
                )} */}
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>
                  {user.displayName || user.email}
                </span>
                <span className='text-muted-foreground truncate text-xs'>
                  {user.email}
                </span>
              </div>
              <MoreVertical className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side='right'
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='h-8 w-8 rounded-lg'>
                  {/* {user.photoURL ? (
                    <AvatarImage
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                    />
                  ) : (
                    <AvatarFallback>{initials}</AvatarFallback>
                  )} */}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>
                    {user.displayName || user.email}
                  </span>
                  <span className='text-muted-foreground truncate text-xs'>
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserCircle />
                Account
              </DropdownMenuItem>
              {/*
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
              */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
