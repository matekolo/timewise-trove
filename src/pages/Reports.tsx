import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, ChevronsUpDown, Download } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval, addDays, parseISO, isSameDay, subDays, getWeeksInMonth, getDaysInMonth, getDate, getMonth, getYear, setDate, setMonth, startOfYear, getWeek, addMonths } from "date-fns";
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
  date?: string;
  time?: string;
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
          start: new Date(selectedDate.getFullYear(), 0, 1), 
          end: new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59) 
        };
      default:
        return { 
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }), 
          end: endOfWeek(selectedDate, { weekStartsOn: 1 }) 
        };
    }
  };
  
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
  
  const getTaskDate = (task: Task): Date => {
    if (task.time) {
      try {
        return parseISO(task.time);
      } catch (e) {
        console.error("Failed to parse task.time:", task.time, e);
      }
    }
    
    return parseISO(task.created_at);
  };
  
  const filteredTasks = tasks.filter(task => {
    try {
      const { start, end } = getDateRange();
      const taskDate = getTaskDate(task);
      
      const isInRange = isWithinInterval(taskDate, { start, end });
      console.log(`Filtering task "${task.title}" (${format(taskDate, "yyyy-MM-dd")}): ${isInRange ? "IN RANGE" : "OUT OF RANGE"} (${format(start, "yyyy-MM-dd")} to ${format(end, "yyyy-MM-dd")})`);
      
      return isInRange;
    } catch (error) {
      console.error("Error filtering task:", task, error);
      return false;
    }
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
    console.log("\n--- GENERATING PRODUCTIVITY DATA ---");
    console.log("Selected date:", date ? format(date, "yyyy-MM-dd") : "None");
    console.log("Time range:", timeRange);
    
    if (timeRange === "day" && date) {
      const dayName = format(date, "EEE");
      console.log(`Day view: showing only ${dayName}`);
      
      const dayTasks = tasks.filter(task => {
        try {
          const taskDate = getTaskDate(task);
          return isSameDay(taskDate, date);
        } catch (error) {
          console.error("Error processing task date:", task, error);
          return false;
        }
      });
      
      console.log(`Total tasks for ${dayName}: ${dayTasks.length}`);
      
      let value = 0;
      if (dayTasks.length > 0) {
        const completedCount = dayTasks.filter(task => task.completed).length;
        value = Math.round((completedCount / dayTasks.length) * 100);
        console.log(`Completion: ${completedCount}/${dayTasks.length} = ${value}%`);
      }
      
      return [{ name: dayName, value }];
    } else if (timeRange === "week" || !timeRange) {
      const startDate = startOfWeek(date || new Date(), { weekStartsOn: 1 });
      
      console.log("Week starting on:", format(startDate, "yyyy-MM-dd"));
      console.log("Total tasks in database:", tasks.length);
      
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const result = [];
      
      for (let i = 0; i < 7; i++) {
        const dayDate = addDays(startDate, i);
        const dayName = days[i];
        
        console.log(`\nProcessing ${dayName}, ${format(dayDate, "yyyy-MM-dd")}`);
        
        const dayTasks = tasks.filter(task => {
          try {
            const taskDate = getTaskDate(task);
            return isSameDay(taskDate, dayDate);
          } catch (error) {
            console.error("Error processing task date:", task, error);
            return false;
          }
        });
        
        console.log(`  Total tasks for ${dayName}: ${dayTasks.length}`);
        
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
    } else if (timeRange === "month" && date) {
      const selectedDate = date || new Date();
      const monthStart = startOfMonth(selectedDate);
      const weeks = [];
      
      console.log("Month view starting on:", format(monthStart, "yyyy-MM-dd"));
      
      const numWeeks = Math.ceil(getDaysInMonth(selectedDate) / 7);
      
      for (let i = 0; i < numWeeks; i++) {
        const weekStart = addDays(monthStart, i * 7);
        const weekEnd = addDays(weekStart, 6);
        
        if (getMonth(weekStart) !== getMonth(selectedDate) && i > 0) continue;
        
        const weekLabel = `W${i + 1}`;
        console.log(`\nProcessing ${weekLabel} (${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")})`);
        
        const weekTasks = tasks.filter(task => {
          try {
            const taskDate = getTaskDate(task);
            return isWithinInterval(taskDate, { start: weekStart, end: weekEnd }) && 
                   getMonth(taskDate) === getMonth(selectedDate);
          } catch (error) {
            console.error("Error processing task date:", task, error);
            return false;
          }
        });
        
        console.log(`  Total tasks for ${weekLabel}: ${weekTasks.length}`);
        
        if (weekTasks.length === 0) {
          weeks.push({ name: weekLabel, value: 0 });
        } else {
          const completedCount = weekTasks.filter(task => task.completed).length;
          const percentage = Math.round((completedCount / weekTasks.length) * 100);
          console.log(`  Completion: ${completedCount}/${weekTasks.length} = ${percentage}%`);
          weeks.push({ name: weekLabel, value: percentage });
        }
      }
      
      console.log("\nFinal monthly productivity data:", weeks);
      return weeks;
    } else if (timeRange === "year" && date) {
      const selectedDate = date || new Date();
      const yearStart = startOfYear(selectedDate);
      const months = [];
      
      console.log("Year view starting on:", format(yearStart, "yyyy-MM-dd"));
      
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      for (let i = 0; i < 12; i++) {
        const monthDate = addMonths(yearStart, i);
        const monthName = monthNames[i];
        const monthStartDate = startOfMonth(monthDate);
        const monthEndDate = endOfMonth(monthDate);
        
        console.log(`\nProcessing ${monthName} ${getYear(selectedDate)}`);
        
        const monthTasks = tasks.filter(task => {
          try {
            const taskDate = getTaskDate(task);
            return isWithinInterval(taskDate, { 
              start: monthStartDate, 
              end: monthEndDate 
            });
          } catch (error) {
            console.error("Error processing task date:", task, error);
            return false;
          }
        });
        
        console.log(`  Total tasks for ${monthName}: ${monthTasks.length}`);
        
        if (monthTasks.length === 0) {
          months.push({ name: monthName, value: 0 });
        } else {
          const completedCount = monthTasks.filter(task => task.completed).length;
          const percentage = Math.round((completedCount / monthTasks.length) * 100);
          console.log(`  Completion: ${completedCount}/${monthTasks.length} = ${percentage}%`);
          months.push({ name: monthName, value: percentage });
        }
      }
      
      console.log("\nFinal yearly productivity data:", months);
      return months;
    }
    
    return [];
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
    const reportDate = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
    const reportTitle = `Productivity Report - ${format(new Date(reportDate), "MMMM d, yyyy")}`;
    
    const currentProductivityData = generateProductivityData();
    const currentCategoryData = generateCategoryData();
    
    let timeRangeText = "";
    switch (timeRange) {
      case "day":
        timeRangeText = `for ${format(date || new Date(), "MMMM d, yyyy")}`;
        break;
      case "week":
        const weekStart = startOfWeek(date || new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date || new Date(), { weekStartsOn: 1 });
        timeRangeText = `for week of ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
        break;
      case "month":
        timeRangeText = `for ${format(date || new Date(), "MMMM yyyy")}`;
        break;
      case "year":
        timeRangeText = `for ${format(date || new Date(), "yyyy")}`;
        break;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
          h1 { color: #3B82F6; margin-bottom: 30px; }
          h2 { color: #1F2937; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
          .summary-box { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .score { font-size: 48px; font-weight: bold; color: #10B981; }
          .stats { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
          .stat { flex: 1; min-width: 120px; padding: 15px; background: #f3f4f6; border-radius: 8px; margin-bottom: 10px; }
          .stat-title { font-weight: bold; margin-bottom: 5px; }
          .categories, .habits { margin-top: 20px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6B7280; }
        </style>
      </head>
      <body>
        <h1>${reportTitle}</h1>
        
        <div class="summary-box">
          <h2>Productivity Summary ${timeRangeText}</h2>
          <div class="score">${productivityScore}%</div>
          <p>Based on ${totalTasksCount} tasks (${completedTasksCount} completed)</p>
        </div>
        
        <h2>Tasks by Category</h2>
        <div class="categories">
          <ul>
            ${currentCategoryData.length > 0 
              ? currentCategoryData.map(cat => `<li><strong>${cat.name}:</strong> ${cat.value} tasks</li>`).join('')
              : '<li>No categorized tasks in this period</li>'
            }
          </ul>
        </div>
        
        <h2>Top Habits</h2>
        <div class="habits">
          ${topHabits.length > 0 
            ? topHabits.map(h => `<p><strong>${h.name}:</strong> ${h.streak} days ${h.type === "bad" ? "avoiding" : "streak"}</p>`).join('') 
            : '<p>No habits tracked yet</p>'
          }
        </div>
        
        <h2>Productivity Breakdown</h2>
        <div class="stats">
          ${currentProductivityData.map(item => 
            `<div class="stat">
              <div class="stat-title">${item.name}</div>
              <div>${item.value}%</div>
             </div>`
          ).join('')}
        </div>
        
        <div class="footer">
          <p>Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `productivity-report-${format(date || new Date(), 'yyyy-MM-dd')}-${timeRange}.html`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report downloaded",
      description: `Your productivity report for the selected ${timeRange} has been downloaded as HTML.`,
    });
  };

  const getHabitColor = (entry: any) => {
    return entry.type === "bad" ? "#EF4444" : "#10B981";
  };

  const handleDateChange = (newDate: Date | undefined) => {
    console.log("Date changed to:", newDate);
    setDate(newDate);
  };

  const handleTimeRangeChange = (newRange: string) => {
    console.log("Time range changed to:", newRange);
    setTimeRange(newRange);
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
    </div>
  );
};

export default Reports;
