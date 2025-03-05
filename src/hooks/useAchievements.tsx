import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Achievement, UserAchievement } from "@/types/achievementTypes";
import { supabase } from "@/integrations/supabase/client";
import { calculateAchievementProgress, applyRewardEffect } from "@/utils/achievementUtils";
import { toast } from "@/components/ui/use-toast";
import { parse, isAfter, isBefore, parseISO, format } from "date-fns";

export const useAchievements = () => {
  const queryClient = useQueryClient();

  // Fetch data needed for achievement tracking
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

  // Create a single function to refresh all achievement data
  const refreshAchievementData = async () => {
    await Promise.all([
      refetchTasks(), 
      refetchHabits(), 
      refetchNotes(), 
      refetchUserAchievements()
    ]);
    
    // Also invalidate the derived achievement progress data
    queryClient.invalidateQueries({ queryKey: ["achievement-progress"] });
  };

  // Calculate achievement progress metrics
  const taskCompletedCount = tasks.filter((task: any) => task.completed).length;
  
  // Count early bird tasks (completed before 9 AM)
  const earlyBirdTasksCount = tasks.filter((task: any) => {
    if (!task.completed || !task.time) return false;
    
    try {
      // Parse the time properly based on its format
      let taskDate = new Date(task.time);
      
      // Extract the hours and minutes
      const hours = taskDate.getHours();
      const minutes = taskDate.getMinutes();
      
      // Log for debugging
      console.log(`Task: ${task.title}, Time: ${task.time}, Hours: ${hours}:${minutes}`);
      
      // Check if the time is before 9:00 AM
      return hours < 9;
    } catch (err) {
      console.error("Error parsing time for early bird task:", err, task);
      return false;
    }
  }).length;
  
  console.log("Early bird tasks count:", earlyBirdTasksCount);
  
  // Count evening tasks (completed after 8 PM)
  const eveningTasksCount = tasks.filter((task: any) => {
    if (!task.completed || !task.time) return false;
    
    try {
      // Parse the time properly
      let taskDate = new Date(task.time);
      
      // Extract the hours
      const hours = taskDate.getHours();
      
      // Check if the time is after 8:00 PM (20:00)
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
  
  // This would need to be implemented with actual data tracking
  const dailyStreak = 0; 

  // Get list of achievements with progress
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

  // Mutation for claiming achievements
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

  // Function for claiming rewards
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

  // Set up event listeners for updates that should trigger achievement refresh
  useEffect(() => {
    const handleUpdate = () => {
      refreshAchievementData();
    };
    
    // Listen for custom events from other parts of the application
    window.addEventListener('task-updated', handleUpdate);
    window.addEventListener('habit-updated', handleUpdate);
    window.addEventListener('note-created', handleUpdate);
    
    // Add specific listener for streak updates
    window.addEventListener('streak-updated', handleUpdate);
    
    return () => {
      window.removeEventListener('task-updated', handleUpdate);
      window.removeEventListener('habit-updated', handleUpdate);
      window.removeEventListener('note-created', handleUpdate);
      window.removeEventListener('streak-updated', handleUpdate);
    };
  }, [refreshAchievementData]);

  return {
    achievements: enhancedAchievements,
    isLoading: loadingAchievements,
    claimReward,
    claimAchievementMutation,
    refreshAchievementData
  };
};
