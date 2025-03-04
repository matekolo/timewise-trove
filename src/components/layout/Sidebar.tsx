
import React from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  ListTodo, 
  BookOpen, 
  BarChart2, 
  CalendarDays, 
  Dumbbell, 
  Trophy,
  Settings
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import UserAvatar from "../ui/UserAvatar";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground font-medium"
            : "hover:bg-secondary text-foreground/80 hover:text-foreground"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

const Sidebar = () => {
  const { t } = useLanguage();

  return (
    <div className="w-64 h-full border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <UserAvatar />
        <div>
          <h2 className="font-semibold">Focus App</h2>
          <p className="text-xs text-muted-foreground">Stay organized</p>
        </div>
      </div>
      
      <nav className="px-2 py-4 flex-1 space-y-1">
        <SidebarLink
          to="/dashboard"
          icon={<LayoutDashboard className="h-5 w-5" />}
          label={t("dashboard")}
        />
        <SidebarLink
          to="/planner"
          icon={<ListTodo className="h-5 w-5" />}
          label={t("planner")}
        />
        <SidebarLink
          to="/habits"
          icon={<Dumbbell className="h-5 w-5" />}
          label={t("habits")}
        />
        <SidebarLink
          to="/notes"
          icon={<BookOpen className="h-5 w-5" />}
          label={t("notes")}
        />
        <SidebarLink
          to="/calendar"
          icon={<CalendarDays className="h-5 w-5" />}
          label={t("calendar")}
        />
        <SidebarLink
          to="/reports"
          icon={<BarChart2 className="h-5 w-5" />}
          label={t("reports")}
        />
        <SidebarLink
          to="/achievements"
          icon={<Trophy className="h-5 w-5" />}
          label={t("achievements")}
        />
        <SidebarLink
          to="/settings"
          icon={<Settings className="h-5 w-5" />}
          label={t("settings")}
        />
      </nav>
    </div>
  );
};

export default Sidebar;
