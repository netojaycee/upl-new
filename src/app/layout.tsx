import type { Metadata } from "next";
import "./globals.css";
import FirebaseProvider from "@/lib/FirebaseProvider";
import { ThemeProvider } from "@/components/local/theme-provider";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "UPL Dashboard",
  description: "Admin Dashboard for managing UPL activities",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={cn("bg-background overscroll-none font-sans antialiased")}
      >
        <FirebaseProvider>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            {children}
            <Toaster richColors closeButton />
          </ThemeProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
