
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Award, Star, CheckIcon, LockIcon, Settings } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Achievement {
  id: string;
  name: string;
  description: string;
  criteria: string;
  reward: string;
  icon: string;
  progress: number;
  unlocked: boolean;
}

const Achievements = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Fetch user stats for achievement calculations
  const { data: tasks = [] } = useQuery({
    queryKey: ["achievement-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });
  
  const { data: habits = [] } = useQuery({
    queryKey: ["achievement-habits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });
  
  // Calculate stats for achievements
  const taskCompletedCount = tasks.filter((task: any) => task.completed).length;
  const longestStreak = habits.reduce((max: number, habit: any) => 
    Math.max(max, habit.streak || 0), 0);
  
  // Example achievement data
  const achievementList: Achievement[] = [
    {
      id: "early-bird",
      name: "Early Bird",
      description: "Complete 5 tasks before 9 AM",
      criteria: "Complete tasks early in the morning",
      reward: "Morning Theme",
      icon: "sun",
      progress: Math.min(taskCompletedCount / 5 * 100, 100),
      unlocked: taskCompletedCount >= 5
    },
    {
      id: "focus-master",
      name: "Focus Master",
      description: "Complete 10 high priority tasks",
      criteria: "Complete high priority tasks",
      reward: "Productivity Avatar",
      icon: "target",
      progress: Math.min((tasks.filter((t: any) => t.priority === "high" && t.completed).length / 10) * 100, 100),
      unlocked: tasks.filter((t: any) => t.priority === "high" && t.completed).length >= 10
    },
    {
      id: "task-champion",
      name: "Task Champion",
      description: "Complete 25 tasks total",
      criteria: "Complete a total of 25 tasks",
      reward: "Champion Badge",
      icon: "award",
      progress: Math.min(taskCompletedCount / 25 * 100, 100),
      unlocked: taskCompletedCount >= 25
    },
    {
      id: "streak-master",
      name: "Streak Master",
      description: "Maintain a 7-day streak on any habit",
      criteria: "Maintain a habit streak for 7 days",
      reward: "Gold Theme",
      icon: "flame",
      progress: Math.min(longestStreak / 7 * 100, 100),
      unlocked: longestStreak >= 7
    },
    {
      id: "zen-mind",
      name: "Zen Mind",
      description: "Create 5 notes",
      criteria: "Create at least 5 notes",
      reward: "Zen Avatar",
      icon: "feather",
      progress: 0,
      unlocked: false
    },
    {
      id: "habit-breaker",
      name: "Habit Breaker",
      description: "Successfully break 3 bad habits",
      criteria: "Mark 3 habits as 'bad' and maintain streak",
      reward: "Custom Theme Colors",
      icon: "scissors",
      progress: 0,
      unlocked: false
    },
    {
      id: "consistency-king",
      name: "Consistency King",
      description: "Complete tasks for 14 consecutive days",
      criteria: "Complete at least one task every day for 14 days",
      reward: "Royal Crown Avatar",
      icon: "crown",
      progress: 30,
      unlocked: false
    },
    {
      id: "night-owl",
      name: "Night Owl",
      description: "Complete 10 tasks after 8 PM",
      criteria: "Complete tasks in the evening",
      reward: "Dark Theme",
      icon: "moon",
      progress: 70,
      unlocked: false
    }
  ];
  
  const categories = [
    { id: "all", name: "All" },
    { id: "unlocked", name: "Unlocked" },
    { id: "locked", name: "Locked" }
  ];
  
  const filteredAchievements = achievementList.filter(achievement => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "unlocked") return achievement.unlocked;
    if (selectedCategory === "locked") return !achievement.unlocked;
    return true;
  });
  
  const claimReward = (achievement: Achievement) => {
    if (!achievement.unlocked) {
      toast({
        title: "Achievement locked",
        description: `Complete the achievement first to claim your reward.`,
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Reward claimed!",
      description: `You've claimed: ${achievement.reward}`,
    });
  };
  
  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case "sun": return <Sun className="h-5 w-5" />;
      case "target": return <div className="h-5 w-5 bg-primary/20 rounded-full flex items-center justify-center"><div className="h-3 w-3 bg-primary rounded-full"></div></div>;
      case "award": return <Award className="h-5 w-5" />;
      case "flame": return <div className="h-5 w-5 text-orange-500">🔥</div>;
      case "feather": return <div className="h-5 w-5">✒️</div>;
      case "scissors": return <div className="h-5 w-5">✂️</div>;
      case "crown": return <div className="h-5 w-5 text-yellow-500">👑</div>;
      case "moon": return <Moon className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold">Achievements</h1>
          <p className="text-muted-foreground">Track your progress and earn rewards</p>
        </motion.div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => navigate("/settings")}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Tile 
              className={`h-full ${achievement.unlocked ? 'border-primary/20' : ''}`}
              contentClassName="p-5 flex flex-col h-full"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    achievement.unlocked 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {achievement.unlocked ? (
                      <Trophy className="h-5 w-5" />
                    ) : (
                      <LockIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span>{Math.round(achievement.progress)}%</span>
                    </div>
                    <Progress value={achievement.progress} className="h-1.5" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="text-muted-foreground mt-0.5">
                        {getAchievementIcon(achievement.icon)}
                      </div>
                      <span className="text-xs">{achievement.criteria}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span className="text-xs">Reward: <span className="font-medium">{achievement.reward}</span></span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant={achievement.unlocked ? "default" : "outline"}
                  size="sm"
                  className={achievement.unlocked ? "" : "opacity-50"}
                  onClick={() => claimReward(achievement)}
                >
                  {achievement.unlocked ? "Claim Reward" : "Locked"}
                </Button>
              </div>
            </Tile>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
