
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Achievement, UserAchievement } from "@/types/achievementTypes";
import { supabase } from "@/integrations/supabase/client";
import { calculateAchievementProgress, applyRewardEffect } from "@/utils/achievementUtils";
import { toast } from "@/components/ui/use-toast";

export const useAchievements = () => {
  const queryClient = useQueryClient();

  // Fetch data needed for achievement tracking
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

  // Calculate achievement progress metrics
  const taskCompletedCount = tasks.filter((task: any) => task.completed).length;
  const highPriorityCompleted = tasks.filter((t: any) => t.priority === "high" && t.completed).length;
  const longestStreak = habits.reduce((max: number, habit: any) => Math.max(max, habit.streak || 0), 0);
  const notesCount = notes.length;
  const badHabitsWithStreak = habits.filter((h: any) => h.type === 'bad' && h.streak >= 7).length;

  // Get list of achievements with progress
  const achievementList = calculateAchievementProgress(
    taskCompletedCount,
    highPriorityCompleted,
    longestStreak,
    notesCount,
    badHabitsWithStreak
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

  return {
    achievements: enhancedAchievements,
    isLoading: loadingAchievements,
    claimReward,
    claimAchievementMutation
  };
};
