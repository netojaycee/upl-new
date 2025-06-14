"use client";

import useAuthStore from "@/lib/store";
import LoaderComponent from "../loading";
import { AppSidebar } from "@/components/local/sidebar/app-sidebar";
import { SiteHeader } from "@/components/local/sidebar/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { getPageTitle } from "@/lib/utils/pageTitle";
import { PageContextProvider, usePageContext } from "@/lib/context/PageContext";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = usePageContext();

  // Get dynamic page title based on current route and context data
  const pageTitle = getPageTitle(pathname, data);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant='floating' />
      <SidebarInset>
        <SiteHeader pageTitle={pageTitle} />
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col gap-2 py-8 px-3'>
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isLoading } = useAuthStore();

  if (isLoading) return <LoaderComponent />;
  return (
    <PageContextProvider>
      <LayoutContent>{children}</LayoutContent>
    </PageContextProvider>
  );
}
