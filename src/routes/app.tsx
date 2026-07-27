import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { FeedbackPrompt } from "@/components/app/feedback-prompt";
import { DEVELOPER } from "@/lib/developer";
import { applyTheme, loadPreferences } from "@/lib/preferences";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  useEffect(() => {
    applyTheme(loadPreferences().theme);
  }, []);


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="text-sm font-medium text-muted-foreground">CareerPilot AI</div>
              <div
                title={`${DEVELOPER.app} — ${DEVELOPER.role}: ${DEVELOPER.name}`}
                className="hidden text-[10px] uppercase tracking-widest text-muted-foreground/70 md:block"
              >
                by {DEVELOPER.name}
              </div>
            </div>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
        <Toaster />
        <FeedbackPrompt />
      </div>
    </SidebarProvider>
  );
}
