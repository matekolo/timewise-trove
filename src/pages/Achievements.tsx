
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Award, Star, Check, Lock, Settings, SunIcon, MoonIcon } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Achievement, UserAchievement } from "@/types/achievementTypes";
import { useLanguage } from "@/contexts/LanguageContext";

const Achievements = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  
  // Get all the data needed for achievement tracking
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
  
  const { data: notes = [] } = useQuery({
    queryKey: ["achievement-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*");
      
      if (error) throw error;
      return data || [];
    },
  });
  
  const { data: userAchievements = [], isLoading: loadingAchievements } = useQuery({
    queryKey: ["user-achievements"],
    queryFn: async () => {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Error fetching user achievements:", error);
        return [];
      }
      
      console.log("Fetched user achievements:", data);
      return data as UserAchievement[];
    },
  });
  
  const claimAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }
      
      // Check if the achievement is already claimed
      const existingAchievement = userAchievements.find(
        ua => ua.achievement_id === achievementId && ua.user_id === user.id
      );
      
      if (existingAchievement && existingAchievement.claimed) {
        return existingAchievement;
      }
      
      if (existingAchievement) {
        // Update existing achievement to claimed
        const { data, error } = await supabase
          .from("user_achievements")
          .update({ claimed: true })
          .eq("id", existingAchievement.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new achievement record
        const { data, error } = await supabase
          .from("user_achievements")
          .insert({
            user_id: user.id,
            achievement_id: achievementId,
            claimed: true,
            unlocked_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
      // Trigger a settings update
      window.dispatchEvent(new Event('settings-updated'));
    }
  });
  
  // Calculate achievement progress
  const taskCompletedCount = tasks.filter((task: any) => task.completed).length;
  const highPriorityCompleted = tasks.filter((t: any) => t.priority === "high" && t.completed).length;
  const longestStreak = habits.reduce((max: number, habit: any) => Math.max(max, habit.streak || 0), 0);
  const notesCount = notes.length;
  
  // Define achievements with real tracking
  const achievementList: Achievement[] = [
    {
      id: "early-bird",
      name: "Early Bird",
      description: "Complete 5 tasks before 9 AM",
      criteria: "Complete tasks early in the morning",
      reward: "Morning Theme",
      icon: "sun",
      progressCount: taskCompletedCount,
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
      progressCount: highPriorityCompleted,
      progress: Math.min(highPriorityCompleted / 10 * 100, 100),
      unlocked: highPriorityCompleted >= 10
    },
    {
      id: "task-champion",
      name: "Task Champion",
      description: "Complete 25 tasks total",
      criteria: "Complete a total of 25 tasks",
      reward: "Champion Badge",
      icon: "award",
      progressCount: taskCompletedCount,
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
      progressCount: longestStreak,
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
      progressCount: notesCount,
      progress: Math.min(notesCount / 5 * 100, 100),
      unlocked: notesCount >= 5
    },
    {
      id: "habit-breaker",
      name: "Habit Breaker",
      description: "Successfully break 3 bad habits",
      criteria: "Mark 3 habits as 'bad' and maintain streak",
      reward: "Custom Theme Colors",
      icon: "scissors",
      progressCount: habits.filter((h: any) => h.type === 'bad' && h.streak >= 7).length,
      progress: Math.min(habits.filter((h: any) => h.type === 'bad' && h.streak >= 7).length / 3 * 100, 100),
      unlocked: habits.filter((h: any) => h.type === 'bad' && h.streak >= 7).length >= 3
    },
    {
      id: "consistency-king",
      name: "Consistency King",
      description: "Complete tasks for 14 consecutive days",
      criteria: "Complete at least one task every day for 14 days",
      reward: "Royal Crown Avatar",
      icon: "crown",
      progressCount: 0, // This would need more complex tracking
      progress: 30, // Placeholder
      unlocked: false
    },
    {
      id: "night-owl",
      name: "Night Owl",
      description: "Complete 10 tasks after 8 PM",
      criteria: "Complete tasks in the evening",
      reward: "Dark Theme",
      icon: "moon",
      progressCount: 0, // This would need time-based tracking
      progress: 70, // Placeholder
      unlocked: false
    }
  ];
  
  const categories = [
    { id: "all", name: t("all") },
    { id: "unlocked", name: t("unlocked") },
    { id: "locked", name: t("locked") }
  ];
  
  // Add 'claimed' property to all achievements based on userAchievements data
  const enhancedAchievements = achievementList.map(achievement => {
    const userAchievement = userAchievements.find(
      ua => ua.achievement_id === achievement.id
    );
    
    return {
      ...achievement,
      claimed: userAchievement?.claimed || false
    };
  });
  
  const filteredAchievements = enhancedAchievements.filter(achievement => {
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
    
    if (achievement.claimed) {
      toast({
        title: "Already claimed",
        description: `You've already claimed this reward.`,
      });
      return;
    }
    
    claimAchievementMutation.mutate(achievement.id, {
      onSuccess: () => {
        applyRewardEffect(achievement);
        
        toast({
          title: t("rewardClaimed"),
          description: `${t("reward")}: ${achievement.reward}`,
        });
      },
      onError: (error) => {
        toast({
          title: "Error claiming reward",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive"
        });
      }
    });
  };
  
  const applyRewardEffect = (achievement: Achievement) => {
    const currentSettings = localStorage.getItem('user-settings') ? 
      JSON.parse(localStorage.getItem('user-settings') || '{}') : 
      {};
    
    switch (achievement.id) {
      case "early-bird":
        localStorage.setItem('user-settings', JSON.stringify({
          ...currentSettings,
          themeColor: 'morning'
        }));
        break;
      case "night-owl":
        localStorage.setItem('user-settings', JSON.stringify({
          ...currentSettings,
          themeColor: 'night',
          darkMode: true
        }));
        break;
      case "zen-mind":
        localStorage.setItem('user-settings', JSON.stringify({
          ...currentSettings,
          avatar: 'zen'
        }));
        break;
      case "focus-master":
        localStorage.setItem('user-settings', JSON.stringify({
          ...currentSettings,
          avatar: 'productivity'
        }));
        break;
      default:
        break;
    }
    
    // Trigger storage event to make sure other components update
    window.dispatchEvent(new Event('settings-updated'));
    
    toast({
      title: "Reward applied!",
      description: "Visit the Settings page to view your reward",
    });
  };
  
  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case "sun": return <SunIcon className="h-5 w-5" />;
      case "target": return <div className="h-5 w-5 bg-primary/20 rounded-full flex items-center justify-center"><div className="h-3 w-3 bg-primary rounded-full"></div></div>;
      case "award": return <Award className="h-5 w-5" />;
      case "flame": return <div className="h-5 w-5 text-orange-500">🔥</div>;
      case "feather": return <div className="h-5 w-5">✒️</div>;
      case "scissors": return <div className="h-5 w-5">✂️</div>;
      case "crown": return <div className="h-5 w-5 text-yellow-500">👑</div>;
      case "moon": return <MoonIcon className="h-5 w-5" />;
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
          <h1 className="text-3xl font-bold">{t("achievements")}</h1>
          <p className="text-muted-foreground">Track your progress and earn rewards</p>
        </motion.div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => navigate("/settings")}
        >
          <Settings className="h-4 w-4" />
          <span>{t("settings")}</span>
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
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {achievement.unlocked ? (
                      achievement.claimed ? <Check className="h-5 w-5" /> : <Trophy className="h-5 w-5" />
                    ) : (
                      <Lock className="h-4 w-4" />
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
                      <span className="text-muted-foreground">{t("progress")}</span>
                      <span>
                        {achievement.progressCount !== undefined ? 
                          `${achievement.progressCount} / ${achievement.id === 'zen-mind' ? '5' : 
                             achievement.id === 'focus-master' ? '10' : 
                             achievement.id === 'streak-master' ? '7' : 
                             achievement.id === 'task-champion' ? '25' : 
                             achievement.id === 'habit-breaker' ? '3' : 
                             achievement.id === 'early-bird' ? '5' : '10'}`
                          : `${Math.round(achievement.progress)}%`}
                      </span>
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
                      <span className="text-xs">{t("reward")}: <span className="font-medium">{achievement.reward}</span></span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant={achievement.unlocked ? (achievement.claimed ? "outline" : "default") : "outline"}
                  size="sm"
                  className={achievement.unlocked ? "" : "opacity-50"}
                  onClick={() => claimReward(achievement)}
                  disabled={claimAchievementMutation.isPending}
                >
                  {claimAchievementMutation.isPending && achievement.id === claimAchievementMutation.variables ? 
                    t("pleaseWait") : 
                    achievement.claimed ? 
                      t("claimed") : 
                      achievement.unlocked ? 
                        t("claimReward") : 
                        t("locked")}
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
