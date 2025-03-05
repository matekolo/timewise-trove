
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { User, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const UserAvatar = ({ size = "md", className = "" }: UserAvatarProps) => {
  const [avatar, setAvatar] = useState<string>("default");
  const [displayName, setDisplayName] = useState<string>("");
  
  // Calculate size in pixels
  const sizeInPx = size === "sm" ? "32px" : size === "md" ? "40px" : "48px";
  
  useEffect(() => {
    // Load avatar from settings
    const loadUserData = async () => {
      try {
        // Get settings for avatar
        const savedSettings = localStorage.getItem('user-settings');
        if (savedSettings) {
          const { avatar: savedAvatar } = JSON.parse(savedSettings);
          if (savedAvatar) {
            setAvatar(savedAvatar);
          }
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
        const { avatar: savedAvatar } = JSON.parse(savedSettings);
        if (savedAvatar) {
          setAvatar(savedAvatar);
        }
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
    <Avatar style={{ width: sizeInPx, height: sizeInPx }} className={className}>
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
      {avatar === "champion" && (
        <AvatarFallback className="bg-primary/10">
          <Award className="h-5 w-5 text-primary/60" />
        </AvatarFallback>
      )}
      <AvatarImage src="" alt={displayName} />
    </Avatar>
  );
};

export default UserAvatar;
