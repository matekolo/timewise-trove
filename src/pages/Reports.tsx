import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, ChevronsUpDown, Download } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, subDays, subWeeks, subMonths, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  created_at: string;
  category?: string;
}

interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
}

interface Habit {
  id: string;
  name: string;
  streak: number;
  type: string;
}

const Reports = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeRange, setTimeRange] = useState("week");
  const navigate = useNavigate();
  
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
  
  const habitData = habits
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .slice(0, 7)
    .map(habit => ({
      name: habit.name.length > 10 ? habit.name.slice(0, 10) + '...' : habit.name,
      value: habit.streak || 0,
      type: habit.type || "good"
    }));
  
  const generateProductivityData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    return days.map(day => {
      const dayTasks = filteredTasks.filter(task => {
        const taskDate = parseISO(task.created_at);
        return format(taskDate, 'EEE') === day;
      });
      
      if (dayTasks.length === 0) return { name: day, value: 0 };
      
      const completedCount = dayTasks.filter(task => task.completed).length;
      const percentage = Math.round((completedCount / dayTasks.length) * 100);
      
      return {
        name: day,
        value: percentage
      };
    });
  };
  
  const productivityData = generateProductivityData();
  
  const generateCategoryData = () => {
    const categories: Record<string, number> = {};
    
    filteredTasks.forEach(task => {
      const category = task.category || 'uncategorized';
      if (categories[category]) {
        categories[category]++;
      } else {
        categories[category] = 1;
      }
    });
    
    return Object.entries(categories).map(([name, value]) => ({ 
      name, 
      value 
    }));
  };
  
  const categoryData = generateCategoryData();
  
  const completedTasksCount = filteredTasks.filter(task => task.completed).length;
  const totalTasksCount = filteredTasks.length;
  const productivityScore = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;
  
  const topHabits = habits
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .slice(0, 2);
  
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];
  
  const downloadReport = () => {
    toast({
      title: "Report downloaded",
      description: "Your productivity report has been downloaded.",
    });
  };

  const getHabitColor = (entry: any) => {
    return entry.type === "bad" ? "#EF4444" : "#10B981";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Track your progress and productivity</p>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{date ? format(date, "MMM d, yyyy") : "Select date"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarUI
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={downloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Tile title="Productivity Score" delay={0}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={productivityData}
                margin={{
                  top: 20,
                  right: 20,
                  left: -10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white",
                    border: "1px solid #f0f0f0",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Tile>
        
        <Tile title="Habit Tracking" delay={1}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={habitData}
                margin={{
                  top: 20,
                  right: 20,
                  left: -10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white",
                    border: "1px solid #f0f0f0",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                  formatter={(value, name, props) => {
                    const habitType = props.payload.type;
                    return [`${value} day ${habitType === "bad" ? "avoiding" : "streak"}`, name];
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]} 
                  name="Progress"
                >
                  {
                    habitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getHabitColor(entry)} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tile>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Tile title="Task Categories" delay={2}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.length > 0 ? categoryData : [{ name: "No data", value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white",
                    border: "1px solid #f0f0f0",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Tile>
        
        <Tile title="Summary" className="md:col-span-2" delay={3}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-green-50 rounded-md text-center">
                <p className="text-green-600 font-medium text-sm">Productivity Score</p>
                <h3 className="text-2xl font-bold text-green-700 mt-1">{productivityScore}%</h3>
                <p className="text-xs text-green-600 mt-1">Based on {totalTasksCount} tasks</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-md text-center">
                <p className="text-blue-600 font-medium text-sm">Completed Tasks</p>
                <h3 className="text-2xl font-bold text-blue-700 mt-1">{completedTasksCount}</h3>
                <p className="text-xs text-blue-600 mt-1">
                  {totalTasksCount > 0 
                    ? `${Math.round((completedTasksCount / totalTasksCount) * 100)}% completion rate` 
                    : 'No tasks yet'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Top Habits</h4>
              <div className="space-y-2">
                {topHabits.length > 0 ? (
                  topHabits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between">
                      <span className="text-sm">{habit.name}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className={`${habit.type === "bad" ? "bg-red-500" : "bg-green-500"} w-2 h-2 rounded-full`}></span>
                        {habit.streak} days {habit.type === "bad" ? "avoiding" : "streak"}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No habits tracked yet</p>
                )}
              </div>
            </div>
          </div>
        </Tile>
      </div>
      
      <div className="flex justify-center mt-4">
        <Button 
          onClick={() => navigate("/achievements")} 
          variant="outline"
          className="flex items-center gap-2"
        >
          View Achievements
        </Button>
      </div>
    </div>
  );
};

export default Reports;
