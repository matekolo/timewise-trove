
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { User, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ChampionBadge from "./ChampionBadge";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showDisplayName?: boolean;
}

const UserAvatar = ({ size = "md", className = "", showDisplayName = false }: UserAvatarProps) => {
  const [avatar, setAvatar] = useState<string>("default");
  const [displayName, setDisplayName] = useState<string>("");
  const [showChampionBadge, setShowChampionBadge] = useState<boolean>(false);
  const [hasChampionAchievement, setHasChampionAchievement] = useState<boolean>(false);
  const [hasConsistencyKingAchievement, setHasConsistencyKingAchievement] = useState<boolean>(false);
  
  // Calculate size in pixels
  const sizeInPx = size === "sm" ? "32px" : size === "md" ? "40px" : "48px";
  
  useEffect(() => {
    // Load avatar from settings
    const loadUserData = async () => {
      try {
        // Get user's data
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Get user's display name
        const name = user.user_metadata?.name || user.email?.split('@')[0] || "";
        setDisplayName(name);
        
        // Get achievements for the user
        const { data: userAchievements, error } = await supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", user.id)
          .eq("claimed", true);
        
        if (error) {
          console.error("Error loading achievements:", error);
          return;
        }
        
        // Check for specific achievements
        const hasCrownAchievement = userAchievements?.some(
          achievement => achievement.achievement_id === "consistency-king"
        ) || false;
        
        const hasChampionBadge = userAchievements?.some(
          achievement => achievement.achievement_id === "task-champion"
        ) || false;
        
        setHasConsistencyKingAchievement(hasCrownAchievement);
        setHasChampionAchievement(hasChampionBadge);
        
        // Get settings for avatar
        const savedSettings = localStorage.getItem('user-settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          
          // Handle avatar selection
          if (parsedSettings.avatar) {
            // If the avatar is 'crown', validate the user has the consistency-king achievement
            if (parsedSettings.avatar === 'crown' && !hasCrownAchievement) {
              // Reset to default if they don't have the achievement
              setAvatar('default');
              
              // Update local storage with default avatar
              localStorage.setItem('user-settings', JSON.stringify({
                ...parsedSettings,
                avatar: 'default'
              }));
              
              console.log("Reset crown avatar to default because user doesn't have the achievement");
            } else {
              setAvatar(parsedSettings.avatar);
            }
          }
          
          // Handle badge settings
          if (hasChampionBadge) {
            setShowChampionBadge(parsedSettings.showChampionBadge || false);
          } else {
            setShowChampionBadge(false);
          }
        }
      } catch (error) {
        console.error("Error loading avatar:", error);
      }
    };

    loadUserData();
    
    // Listen for settings changes
    const handleSettingsUpdate = () => {
      loadUserData(); // Reload all user data when settings change
    };
    
    window.addEventListener('storage', handleSettingsUpdate);
    window.addEventListener('settings-updated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('storage', handleSettingsUpdate);
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, []);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar style={{ width: sizeInPx, height: sizeInPx }}>
        {avatar === "default" && (
          <AvatarFallback className="bg-primary/10">
            <User className="h-5 w-5 text-primary/60" />
          </AvatarFallback>
        )}
        {avatar === "zen" && (
          <AvatarFallback className="bg-primary/10 text-lg">
            🧘
          </AvatarFallback>
        )}
        {avatar === "productivity" && (
          <AvatarFallback className="bg-primary/10 text-lg">
            ⚡
          </AvatarFallback>
        )}
        {avatar === "crown" && (
          <AvatarFallback className="bg-primary/10 text-lg">
            👑
          </AvatarFallback>
        )}
        <AvatarImage src="" alt={displayName} />
      </Avatar>

      {(showDisplayName || (showChampionBadge && hasChampionAchievement)) && (
        <div className="flex flex-col items-start">
          {showDisplayName && (
            <span className="text-sm font-medium">{displayName}</span>
          )}
          {showChampionBadge && hasChampionAchievement && (
            <ChampionBadge className={showDisplayName ? "mt-1" : ""} />
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
