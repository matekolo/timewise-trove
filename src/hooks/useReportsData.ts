
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { 
  format, 
  parseISO, 
  isWithinInterval, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  subMonths,
  subDays
} from "date-fns";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  created_at: string;
  category?: string;
}

export interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
}

export type TimeRange = "day" | "week" | "month" | "year";

export const useReportsData = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  
  const getDateRange = () => {
    const today = new Date();
    
    switch (timeRange) {
      case "day":
        return { start: today, end: today };
      case "week":
        return { 
          start: startOfWeek(today), 
          end: endOfWeek(today) 
        };
      case "month":
        return { 
          start: startOfMonth(today), 
          end: endOfMonth(today) 
        };
      case "year":
        return { 
          start: subMonths(today, 12), 
          end: today 
        };
      default:
        return { start: subDays(today, 7), end: today };
    }
  };
  
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*");
      
      if (error) {
        toast({
          title: "Error fetching tasks",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Task[];
    },
  });
  
  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*");
      
      if (error) {
        toast({
          title: "Error fetching events",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Event[];
    },
  });
  
  const { data: habits = [] } = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*");
      
      if (error) {
        toast({
          title: "Error fetching habits",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Habit[];
    },
  });
  
  const filteredTasks = tasks.filter(task => {
    const { start, end } = getDateRange();
    const taskDate = parseISO(task.created_at);
    return isWithinInterval(taskDate, { start, end });
  });
  
  return {
    tasks,
    events,
    habits,
    filteredTasks,
    timeRange,
    setTimeRange,
    getDateRange
  };
};
