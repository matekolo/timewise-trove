
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserAchievement } from "@/types/achievementTypes";

type Achievement = {
  id: string;
  name: string;
  reward: string;
  unlocked: boolean;
};

export const useSettingsAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setAchievements([]);
          return;
        }
        
        // Fetch user achievements from Supabase
        const { data: userAchievements, error } = await supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", user.id);
        
        if (error) {
          console.error("Error fetching user achievements:", error);
          setAchievements([]);
          return;
        }
        
        // Define achievements for settings page
        const availableAchievements = [
          { id: "early-bird", name: "Early Bird", reward: "Morning Theme" },
          { id: "night-owl", name: "Night Owl", reward: "Dark Theme" },
          { id: "zen-mind", name: "Zen Mind", reward: "Zen Avatar" },
          { id: "focus-master", name: "Focus Master", reward: "Productivity Avatar" },
          { id: "streak-master", name: "Streak Master", reward: "Gold Theme" },
          { id: "task-champion", name: "Task Champion", reward: "Champion Badge" },
          { id: "habit-breaker", name: "Habit Breaker", reward: "Custom Theme Colors" }
        ];
        
        // Map achievements to unlocked status
        const mappedAchievements = availableAchievements.map(achievement => ({
          ...achievement,
          unlocked: (userAchievements as UserAchievement[]).some(
            ua => ua.achievement_id === achievement.id && ua.claimed
          )
        }));
        
        setAchievements(mappedAchievements);
      } catch (error) {
        console.error("Error in fetchAchievements:", error);
        setAchievements([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
    
    // Listen for settings updates to refresh achievements
    const handleSettingsUpdate = () => {
      fetchAchievements();
    };
    
    window.addEventListener('settings-updated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, []);

  return { achievements, isLoading };
};
