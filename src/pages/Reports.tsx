
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, ChevronsUpDown, Download } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { toast } from "@/components/ui/use-toast";

const Reports = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeRange, setTimeRange] = useState("week");
  
  // Sample data for demonstration
  const habitData = [
    { name: "Mon", value: 2 },
    { name: "Tue", value: 4 },
    { name: "Wed", value: 3 },
    { name: "Thu", value: 5 },
    { name: "Fri", value: 3 },
    { name: "Sat", value: 2 },
    { name: "Sun", value: 1 },
  ];
  
  const productivityData = [
    { name: "Mon", value: 60 },
    { name: "Tue", value: 85 },
    { name: "Wed", value: 75 },
    { name: "Thu", value: 90 },
    { name: "Fri", value: 80 },
    { name: "Sat", value: 65 },
    { name: "Sun", value: 45 },
  ];
  
  const categoryData = [
    { name: "Work", value: 40 },
    { name: "Personal", value: 25 },
    { name: "Health", value: 15 },
    { name: "Learning", value: 20 },
  ];
  
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];
  
  const downloadReport = () => {
    toast({
      title: "Report downloaded",
      description: "Your productivity report has been downloaded.",
    });
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
                />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
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
                  data={categoryData}
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
                <h3 className="text-2xl font-bold text-green-700 mt-1">78%</h3>
                <p className="text-xs text-green-600 mt-1">↑ 12% from last week</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-md text-center">
                <p className="text-blue-600 font-medium text-sm">Completed Tasks</p>
                <h3 className="text-2xl font-bold text-blue-700 mt-1">24</h3>
                <p className="text-xs text-blue-600 mt-1">↑ 8 from last week</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Top Habits</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">No smoking</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="bg-green-500 w-2 h-2 rounded-full"></span>
                    5 days streak
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Daily meditation</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="bg-green-500 w-2 h-2 rounded-full"></span>
                    3 days streak
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tile>
      </div>
      
      <div className="mt-8 text-center">
        <h3 className="text-lg font-medium text-gray-700">Achievements</h3>
        <p className="text-muted-foreground mt-1 mb-4">Start building habits to unlock achievements</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {["Early Bird", "Focus Master", "Task Champion", "Streak Master", "Zen Mind"].map((achievement, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-3 border rounded-md opacity-40 hover:opacity-60 transition-opacity"
            >
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-2 flex items-center justify-center">
                <span className="text-xl">🔒</span>
              </div>
              <span className="text-xs text-center">{achievement}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
