
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import HabitTracker from "./pages/HabitTracker";
import Planner from "./pages/Planner";
import Notes from "./pages/Notes";
import CalendarView from "./pages/CalendarView";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Achievements from "./pages/Achievements";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Both Toaster components outside of Routes and directly in the root component */}
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="habits" element={<HabitTracker />} />
            <Route path="planner" element={<Planner />} />
            <Route path="notes" element={<Notes />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="reports" element={<Reports />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
