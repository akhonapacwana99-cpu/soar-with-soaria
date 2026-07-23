import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { WordMark, Logo } from "@/components/brand/logo";
import {
  LayoutDashboard, MessageCircle, Sparkles, Trophy, Target,
  FolderKanban, FileText, Mail, FileSearch, Linkedin, Layers,
  Briefcase, GraduationCap, ListChecks, NotebookPen, Mic,
  Compass, Heart, Award, History, Bell, Settings, HelpCircle, Info,
} from "lucide-react";

type Item = { to: string; label: string; icon: any };

const groups: { label: string; items: Item[] }[] = [
  {
    label: "Overview",
    items: [
      { to: "/app", label: "Dashboard", icon: LayoutDashboard },
      { to: "/app/soaria", label: "Ask Soaria", icon: MessageCircle },
      { to: "/app/dna", label: "Career DNA", icon: Sparkles },
      { to: "/app/journey", label: "Ascension Journey", icon: Trophy },
      { to: "/app/readiness", label: "Career Readiness", icon: Target },
    ],
  },
  {
    label: "Documents",
    items: [
      { to: "/app/documents", label: "Document Workspace", icon: FolderKanban },
      { to: "/app/cv", label: "CV Builder", icon: FileText },
      { to: "/app/cover-letter", label: "Cover Letter", icon: Mail },
      { to: "/app/ats", label: "ATS Checker", icon: FileSearch },
      { to: "/app/linkedin", label: "LinkedIn Optimizer", icon: Linkedin },
      { to: "/app/portfolio", label: "Portfolio Builder", icon: Layers },
      { to: "/app/email", label: "Email Generator", icon: Mail },
    ],
  },
  {
    label: "Growth",
    items: [
      { to: "/app/explorer", label: "Career Explorer", icon: Compass },
      { to: "/app/opportunities", label: "Opportunity Hub", icon: Briefcase },
      { to: "/app/learning", label: "Learning Coach", icon: GraduationCap },
      { to: "/app/productivity", label: "Productivity Planner", icon: ListChecks },
      { to: "/app/notes", label: "Notes & Summarizer", icon: NotebookPen },
      { to: "/app/interview", label: "Mock Interview", icon: Mic },
      { to: "/app/reflection", label: "Reflection Corner", icon: Heart },
    ],
  },
  {
    label: "You",
    items: [
      { to: "/app/achievements", label: "Progress & Achievements", icon: Award },
      { to: "/app/history", label: "History", icon: History },
      { to: "/app/notifications", label: "Notifications", icon: Bell },
      { to: "/app/settings", label: "Settings", icon: Settings },
      { to: "/app/help", label: "Help", icon: HelpCircle },
      { to: "/app/about", label: "About", icon: Info },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-1.5">
          {collapsed ? <Logo className="h-7 w-7" /> : <WordMark />}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && <SidebarGroupLabel>{g.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = pathname === item.to;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        <Link to={item.to} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
