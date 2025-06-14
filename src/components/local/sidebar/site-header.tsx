import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/local/mode-toggle";
import { PageTitleConfig } from "@/lib/utils/pageTitle";
import { ChevronRight } from "lucide-react";

export function SiteHeader({ pageTitle }: { pageTitle: PageTitleConfig }) {
  return (
    <header className='flex h-[90px] py-4 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mx-2 data-[orientation=vertical]:h-4'
        />

        <div className='flex items-center gap-3'>
          {pageTitle.icon && (
            <span className='text-xl' role='img' aria-label='page icon'>
              {pageTitle.icon}
            </span>
          )}
          <div className='flex flex-col min-w-0'>
            {/* Breadcrumb navigation */}
            {pageTitle.breadcrumb && pageTitle.breadcrumb.length > 1 && (
              <div className='flex items-center gap-1 text-xs text-muted-foreground mb-1'>
                {pageTitle.breadcrumb.map((crumb, index) => (
                  <div key={index} className='flex items-center gap-1'>
                    {index > 0 && <ChevronRight className='h-3 w-3' />}
                    <span
                      className={
                        index === pageTitle.breadcrumb!.length - 1
                          ? "text-foreground font-medium"
                          : ""
                      }
                    >
                      {crumb}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <h1 className='text-lg font-semibold text-foreground leading-tight truncate'>
              {pageTitle.title}
            </h1>
            {pageTitle.subtitle && (
              <p className='text-sm text-muted-foreground leading-none truncate'>
                {pageTitle.subtitle}
              </p>
            )}
          </div>
        </div>

        <div className='ml-auto flex items-center gap-2'>
          <span className='cursor-pointer'>
            <ModeToggle />
          </span>
        </div>
      </div>
    </header>
  );
}
