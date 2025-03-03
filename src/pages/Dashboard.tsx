
import { motion } from "framer-motion";
import { CalendarClock, BarChart2, FileText, Activity, ArrowRight } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(72);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
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
      title: "Reports",
      description: "View your productivity reports",
      icon: BarChart2,
      path: "/reports",
      delay: 3
    }
  ];
  
  const tasksForToday = [
    { id: 1, title: "Review project proposal", completed: true },
    { id: 2, title: "Team meeting at 2PM", completed: true },
    { id: 3, title: "Complete weekly report", completed: false },
    { id: 4, title: "Plan tomorrow's schedule", completed: false }
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
                <span>Productivity</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Habit Streaks</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">No smoking</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div 
                      key={day} 
                      className={`w-3 h-3 rounded-sm ${
                        day <= 5 ? "bg-primary/80" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Daily exercise</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div 
                      key={day} 
                      className={`w-3 h-3 rounded-sm ${
                        day <= 3 ? "bg-primary/80" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Tile>
        
        <Tile title="Today's Tasks" delay={5}>
          <div className="space-y-3">
            {tasksForToday.map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border ${
                  task.completed 
                    ? "bg-primary border-primary text-white flex items-center justify-center"
                    : "border-gray-300"
                }`}>
                  {task.completed && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                  {task.title}
                </span>
              </div>
            ))}
            
            <Button variant="outline" size="sm" className="w-full mt-4">
              View all tasks
            </Button>
          </div>
        </Tile>
      </div>
    </div>
  );
};

export default Dashboard;
