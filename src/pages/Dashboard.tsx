import { motion } from "framer-motion";
import { CalendarClock, BarChart2, FileText, Activity, ArrowRight, Trophy } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category?: string;
  created_at?: string;
  updated_at?: string;
  description?: string;
  priority?: string;
  time?: string;
  user_id?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["dashboard-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      
      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }
      
      return (data as any[]).map(task => ({
        ...task,
        category: task.category || "work"
      })) as Task[];
    },
  });
  
  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ["dashboard-habits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*");
      
      if (error) {
        console.error("Error fetching habits:", error);
        throw error;
      }
      
      return data;
    },
  });
  
  useEffect(() => {
    if (!tasksLoading && tasks.length > 0) {
      const completedCount = tasks.filter(task => task.completed).length;
      const calculatedProgress = Math.round((completedCount / tasks.length) * 100);
      setProgress(calculatedProgress);
    } else {
      setProgress(0);
    }
  }, [tasks, tasksLoading]);
  
  const tiles = [
    {
      title: "Habit Tracker",
      description: "Track your progress on breaking bad habits",
      icon: Activity,
      path: "/habits",
      delay: 0
    },
    {
      title: "Daily Planner",
      description: "Plan your day efficiently",
      icon: CalendarClock,
      path: "/planner",
      delay: 1
    },
    {
      title: "Notes",
      description: "Quick access to your notes",
      icon: FileText,
      path: "/notes",
      delay: 2
    },
    {
      title: "Achievements",
      description: "View your earned achievements and rewards",
      icon: Trophy,
      path: "/achievements",
      delay: 3
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">Here's an overview of your productivity</p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiles.map((tile, index) => (
          <Tile
            key={index}
            onClick={() => navigate(tile.path)}
            delay={tile.delay}
            className="h-full"
          >
            <div className="flex flex-col h-full">
              <div className="mb-4 p-2 bg-primary/10 rounded-lg w-fit">
                <tile.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">{tile.title}</h3>
              <p className="text-muted-foreground text-sm mt-1 mb-4">{tile.description}</p>
              <div className="mt-auto flex justify-end">
                <Button variant="ghost" size="sm" className="gap-1">
                  <span>Open</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Tile>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Tile title="Weekly Progress" delay={4}>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Task Completion</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Habit Streaks</h4>
              {habitsLoading ? (
                <div className="py-2 text-center text-sm text-muted-foreground">Loading habits...</div>
              ) : habits.length > 0 ? (
                habits.slice(0, 2).map((habit: any) => (
                  <div key={habit.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{habit.name}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 7 }).map((_, day) => (
                        <div 
                          key={day} 
                          className={`w-3 h-3 rounded-sm ${
                            day < (habit.streak || 0) ? "bg-primary/80" : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No habits tracked yet</p>
              )}
            </div>
          </div>
        </Tile>
        
        <Tile title="Today's Tasks" delay={5}>
          <div className="space-y-3">
            {tasksLoading ? (
              <div className="py-2 text-center text-sm text-muted-foreground">Loading tasks...</div>
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border ${
                    task.completed 
                      ? "bg-primary border-primary text-white flex items-center justify-center"
                      : "border-gray-300"
                  }`}>
                    {task.completed && (
                      <CheckIcon className="h-3 w-3" />
                    )}
                  </div>
                  <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                    {task.title}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-sm text-muted-foreground">No tasks scheduled</p>
            )}
            
            <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate("/planner")}>
              View all tasks
            </Button>
          </div>
        </Tile>
      </div>
      
      <div className="flex justify-between mt-2">
        <Button variant="outline" size="sm" onClick={() => navigate("/calendar")}>
          View Calendar
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>
          View Reports
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
