
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, ChevronsUpDown, Download } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval, addDays, parseISO, isSameDay, subDays } from "date-fns";
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
  
  // Get the date range based on the selected timeRange and date
  const getDateRange = () => {
    const selectedDate = date || new Date();
    
    switch (timeRange) {
      case "day":
        return { 
          start: startOfDay(selectedDate), 
          end: endOfDay(selectedDate) 
        };
      case "week":
        return { 
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }), 
          end: endOfWeek(selectedDate, { weekStartsOn: 1 }) 
        };
      case "month":
        return { 
          start: startOfMonth(selectedDate), 
          end: endOfMonth(selectedDate) 
        };
      case "year":
        return { 
          start: subMonths(selectedDate, 12), 
          end: selectedDate 
        };
      default:
        return { 
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }), 
          end: endOfWeek(selectedDate, { weekStartsOn: 1 }) 
        };
    }
  };
  
  // Fetch all tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", "all", date?.toISOString(), timeRange],
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
      
      console.log("Tasks fetched from database:", data);
      return data as Task[];
    },
  });
  
  // Fetch all events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["events", "all"],
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
  
  // Fetch all habits
  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ["habits", "all"],
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
  
  // Filter tasks based on date range
  const filteredTasks = tasks.filter(task => {
    const { start, end } = getDateRange();
    const taskDate = parseISO(task.created_at);
    const isInRange = isWithinInterval(taskDate, { start, end });
    console.log(`Filtering task "${task.title}" (${format(taskDate, "yyyy-MM-dd HH:mm")}): ${isInRange ? "IN RANGE" : "OUT OF RANGE"} (${format(start, "yyyy-MM-dd")} to ${format(end, "yyyy-MM-dd")})`);
    return isInRange;
  });
  
  // Format habit data for chart
  const habitData = habits
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .slice(0, 7)
    .map(habit => ({
      name: habit.name.length > 10 ? habit.name.slice(0, 10) + '...' : habit.name,
      value: habit.streak || 0,
      type: habit.type || "good"
    }));
  
  // Generate productivity data for the chart
  const generateProductivityData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const result = [];
    
    // Get current week's dates based on selected date
    const selectedDate = date || new Date();
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    
    console.log("\n--- GENERATING PRODUCTIVITY DATA ---");
    console.log("Selected date:", format(selectedDate, "yyyy-MM-dd"));
    console.log("Week starting on:", format(weekStart, "yyyy-MM-dd"));
    console.log("Total tasks in database:", tasks.length);
    
    // Debug all tasks
    console.log("\nAll tasks in database:");
    tasks.forEach(task => {
      console.log(`Task: "${task.title}" | Created: ${task.created_at} | Completed: ${task.completed}`);
    });
    
    // Generate data for each day of the week
    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(weekStart, i);
      const dayStart = startOfDay(dayDate);
      const dayEnd = endOfDay(dayDate);
      const dayName = days[i];
      
      console.log(`\nProcessing ${dayName}, ${format(dayDate, "yyyy-MM-dd")}`);
      console.log(`  Range: ${format(dayStart, "yyyy-MM-dd HH:mm:ss")} to ${format(dayEnd, "yyyy-MM-dd HH:mm:ss")}`);
      
      // Get tasks for this day using direct date comparison
      const dayTasks = tasks.filter(task => {
        const taskDate = parseISO(task.created_at);
        // Use exact day comparison 
        const taskInDay = isSameDay(taskDate, dayDate);
        
        if (taskInDay) {
          console.log(`  ✓ Task "${task.title}" matches for ${dayName} (${format(taskDate, "yyyy-MM-dd HH:mm")})`);
        }
        
        return taskInDay;
      });
      
      console.log(`  Total tasks for ${dayName}: ${dayTasks.length}`);
      
      // Calculate completion percentage
      if (dayTasks.length === 0) {
        result.push({ name: dayName, value: 0 });
      } else {
        const completedCount = dayTasks.filter(task => task.completed).length;
        const percentage = Math.round((completedCount / dayTasks.length) * 100);
        console.log(`  Completion: ${completedCount}/${dayTasks.length} = ${percentage}%`);
        result.push({ name: dayName, value: percentage });
      }
    }
    
    console.log("\nFinal productivity data:", result);
    return result;
  };
  
  // Generate productivity data
  const productivityData = generateProductivityData();
  
  // Generate category data
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
  
  // Calculate productivity score
  const completedTasksCount = filteredTasks.filter(task => task.completed).length;
  const totalTasksCount = filteredTasks.length;
  const productivityScore = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;
  
  // Get top habits
  const topHabits = habits
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .slice(0, 2);
  
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];
  
  // Download report as JSON
  const downloadReport = () => {
    const reportData = {
      date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      timeRange,
      productivityScore,
      completedTasks: completedTasksCount,
      totalTasks: totalTasksCount,
      categories: categoryData,
      productivityByDay: productivityData,
      topHabits: topHabits.map(h => ({
        name: h.name,
        streak: h.streak,
        type: h.type
      }))
    };
    
    const jsonString = JSON.stringify(reportData, null, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `productivity-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report downloaded",
      description: "Your productivity report has been downloaded as JSON.",
    });
  };

  // Get habit color based on type
  const getHabitColor = (entry: any) => {
    return entry.type === "bad" ? "#EF4444" : "#10B981";
  };

  // Handle date change
  const handleDateChange = (newDate: Date | undefined) => {
    console.log("Date changed to:", newDate);
    setDate(newDate);
  };

  // Handle time range change
  const handleTimeRangeChange = (newRange: string) => {
    console.log("Time range changed to:", newRange);
    setTimeRange(newRange);
  };

  // Render the reports page
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
              <div className="calendar-container">
                <CalendarUI
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </div>
            </PopoverContent>
          </Popover>
          
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
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
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white",
                    border: "1px solid #f0f0f0",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                  formatter={(value) => [`${value}%`, 'Completion Rate']}
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
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-md text-center">
                <p className="text-green-600 dark:text-green-400 font-medium text-sm">Productivity Score</p>
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{productivityScore}%</h3>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Based on {totalTasksCount} tasks</p>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md text-center">
                <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">Completed Tasks</p>
                <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{completedTasksCount}</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
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
