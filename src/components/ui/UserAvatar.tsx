
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
  
  // Calculate size in pixels
  const sizeInPx = size === "sm" ? "32px" : size === "md" ? "40px" : "48px";
  
  useEffect(() => {
    // Load avatar from settings
    const loadUserData = async () => {
      try {
        // Get settings for avatar
        const savedSettings = localStorage.getItem('user-settings');
        if (savedSettings) {
          const { avatar: savedAvatar, showChampionBadge: savedShowChampionBadge } = JSON.parse(savedSettings);
          if (savedAvatar) {
            setAvatar(savedAvatar);
          }
          setShowChampionBadge(savedShowChampionBadge || false);
        }
        
        // Get user's display name
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.name || user.email?.split('@')[0] || "";
          setDisplayName(name);
        }
      } catch (error) {
        console.error("Error loading avatar:", error);
      }
    };

    loadUserData();
    
    // Listen for settings changes
    const handleSettingsUpdate = () => {
      const savedSettings = localStorage.getItem('user-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.avatar) {
          setAvatar(parsedSettings.avatar);
        }
        setShowChampionBadge(parsedSettings.showChampionBadge || false);
      }
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
        <AvatarImage src="" alt={displayName} />
      </Avatar>

      {(showDisplayName || showChampionBadge) && (
        <div className="flex flex-col items-start">
          {showDisplayName && (
            <span className="text-sm font-medium">{displayName}</span>
          )}
          {showChampionBadge && (
            <ChampionBadge className={showDisplayName ? "mt-1" : ""} />
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
