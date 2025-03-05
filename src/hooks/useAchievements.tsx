import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Achievement, UserAchievement } from "@/types/achievementTypes";
import { supabase } from "@/integrations/supabase/client";
import { calculateAchievementProgress, applyRewardEffect } from "@/utils/achievementUtils";
import { toast } from "@/components/ui/use-toast";
import { parse, isAfter, isBefore, parseISO, format, subDays, isWithinInterval, startOfDay, endOfDay, differenceInDays } from "date-fns";

export const useAchievements = () => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ["achievement-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*");
      
      if (error) throw error;
      console.log("All tasks:", data);
      return data;
    },
  });
  
  const { data: habits = [], refetch: refetchHabits } = useQuery({
    queryKey: ["achievement-habits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });
  
  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ["achievement-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*");
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: userAchievements = [], isLoading: loadingAchievements, refetch: refetchUserAchievements } = useQuery({
    queryKey: ["user-achievements"],
    queryFn: async () => {
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

  const refreshAchievementData = async () => {
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        refetchTasks(), 
        refetchHabits(), 
        refetchNotes(), 
        refetchUserAchievements()
      ]);
      
      queryClient.invalidateQueries({ queryKey: ["achievement-progress"] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      
      console.log("Achievement data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing achievement data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const taskCompletedCount = tasks.filter((task: any) => task.completed).length;
  
  const earlyBirdTasksCount = tasks.filter((task: any) => {
    if (!task.completed || !task.time) return false;
    
    try {
      let taskDate = new Date(task.time);
      
      const hours = taskDate.getHours();
      const minutes = taskDate.getMinutes();
      
      console.log(`Task: ${task.title}, Time: ${task.time}, Hours: ${hours}:${minutes}`);
      
      return hours < 9;
    } catch (err) {
      console.error("Error parsing time for early bird task:", err, task);
      return false;
    }
  }).length;
  
  console.log("Early bird tasks count:", earlyBirdTasksCount);
  
  const eveningTasksCount = tasks.filter((task: any) => {
    if (!task.completed || !task.time) return false;
    
    try {
      let taskDate = new Date(task.time);
      
      const hours = taskDate.getHours();
      
      return hours >= 20;
    } catch (err) {
      console.error("Error parsing time for night owl task:", err);
      return false;
    }
  }).length;
  
  const highPriorityCompleted = tasks.filter((t: any) => t.priority === "high" && t.completed).length;
  const longestStreak = habits.reduce((max: number, habit: any) => Math.max(max, habit.streak || 0), 0);
  const notesCount = notes.length;
  const badHabitsWithStreak = habits.filter((h: any) => h.type === 'bad' && h.streak >= 7).length;
  
  const calculateDailyStreak = (): number => {
    const completedTasks = tasks.filter((task: any) => task.completed);
    
    if (completedTasks.length === 0) return 0;
    
    const datesWithCompletedTasks = new Set<string>();
    
    completedTasks.forEach((task: any) => {
      const taskDate = task.time ? new Date(task.time) : new Date(task.created_at);
      const dateStr = taskDate.toISOString().split('T')[0];
      datesWithCompletedTasks.add(dateStr);
    });
    
    const sortedDates = Array.from(datesWithCompletedTasks).sort();
    console.log("Sorted dates with completed tasks:", sortedDates);
    
    if (sortedDates.length === 0) return 0;
    
    let currentStreak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const prevDate = new Date(sortedDates[i-1]);
      
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    console.log("Calculated daily streak:", maxStreak, "from days:", sortedDates);
    return maxStreak;
  };
  
  const dailyStreak = calculateDailyStreak();
  console.log("Current daily streak:", dailyStreak);

  const achievementList = calculateAchievementProgress(
    taskCompletedCount,
    earlyBirdTasksCount,
    highPriorityCompleted,
    longestStreak,
    notesCount,
    badHabitsWithStreak,
    eveningTasksCount,
    dailyStreak
  );

  const enhancedAchievements = achievementList.map(achievement => {
    const userAchievement = userAchievements.find(
      ua => ua.achievement_id === achievement.id
    );
    
    return {
      ...achievement,
      claimed: userAchievement?.claimed || false
    };
  });

  const claimAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }
      
      const existingAchievement = userAchievements.find(
        ua => ua.achievement_id === achievementId && ua.user_id === user.id
      );
      
      if (existingAchievement && existingAchievement.claimed) {
        return existingAchievement;
      }
      
      if (existingAchievement) {
        const { data, error } = await supabase
          .from("user_achievements")
          .update({ claimed: true })
          .eq("id", existingAchievement.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
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
      window.dispatchEvent(new Event('settings-updated'));
    }
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
          title: "Reward claimed!",
          description: `Reward: ${achievement.reward}`,
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

  useEffect(() => {
    const handleUpdate = () => {
      console.log("Achievement update triggered by event");
      refreshAchievementData();
    };
    
    const handleStreakUpdate = () => {
      console.log("Streak update event received");
      refreshAchievementData();
    };
    
    window.addEventListener('task-updated', handleUpdate);
    window.addEventListener('habit-updated', handleUpdate);
    window.addEventListener('note-created', handleUpdate);
    window.addEventListener('streak-updated', handleStreakUpdate);
    
    return () => {
      window.removeEventListener('task-updated', handleUpdate);
      window.removeEventListener('habit-updated', handleUpdate);
      window.removeEventListener('note-created', handleUpdate);
      window.removeEventListener('streak-updated', handleStreakUpdate);
    };
  }, []);

  return {
    achievements: enhancedAchievements,
    isLoading: loadingAchievements || isRefreshing,
    claimReward,
    claimAchievementMutation,
    refreshAchievementData,
    isRefreshing
  };
};
