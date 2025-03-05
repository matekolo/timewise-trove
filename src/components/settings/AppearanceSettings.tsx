
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, User, Award, Palette } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { UserSettings } from "@/hooks/useUserSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import UserAvatar from "@/components/ui/UserAvatar";
import ChampionBadge from "@/components/ui/ChampionBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

interface Achievement {
  id: string;
  name: string;
  unlocked: boolean;
}

interface AppearanceSettingsProps {
  settings: UserSettings;
  updateSetting: (key: keyof UserSettings, value: any) => void;
  displayName: string;
  achievements: Achievement[];
  hasAchievement?: (id: string) => boolean;
  refreshAchievements?: () => Promise<string[]>;
}

const AppearanceSettings = ({ 
  settings, 
  updateSetting, 
  displayName, 
  achievements,
  hasAchievement,
  refreshAchievements
}: AppearanceSettingsProps) => {
  const { t } = useLanguage();
  const [customColor, setCustomColor] = useState(settings.customColor || "#3b82f6");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  
  // Load user achievements on component mount
  useEffect(() => {
    const loadAchievements = async () => {
      if (refreshAchievements) {
        await refreshAchievements();
      } else {
        // Fallback if refreshAchievements not provided
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from("user_achievements")
              .select("achievement_id")
              .eq("user_id", user.id)
              .eq("claimed", true);
              
            if (data) {
              setUserAchievements(data.map(a => a.achievement_id));
            }
          }
        } catch (error) {
          console.error("Error fetching achievements in AppearanceSettings:", error);
        }
      }
    };
    
    loadAchievements();
  }, [refreshAchievements]);
  
  const availableThemes = [
    { id: "blue", name: "Default Blue", requiresAchievement: false },
    { id: "green", name: "Forest Green", requiresAchievement: false },
    { id: "purple", name: "Royal Purple", requiresAchievement: false },
    { id: "morning", name: "Morning Sunrise", requiresAchievement: true, achievement: "early-bird" },
    { id: "night", name: "Night Owl", requiresAchievement: true, achievement: "night-owl" },
    { id: "gold", name: "Gold Theme", requiresAchievement: true, achievement: "streak-master" },
    { id: "custom", name: "Custom Color", requiresAchievement: true, achievement: "habit-breaker" }
  ];
  
  const availableAvatars = [
    { id: "default", name: "Default", requiresAchievement: false },
    { id: "zen", name: "Zen Master", requiresAchievement: true, achievement: "zen-mind" },
    { id: "productivity", name: "Productivity Pro", requiresAchievement: true, achievement: "focus-master" },
    { id: "crown", name: "Royal Crown", requiresAchievement: true, achievement: "consistency-king" }
  ];

  // Check if achievement is unlocked - using prop function or local state
  const checkAchievement = (achievementId: string): boolean => {
    if (hasAchievement) {
      return hasAchievement(achievementId);
    }
    return userAchievements.includes(achievementId) || 
           achievements.some(a => a.id === achievementId && a.unlocked);
  };
  
  const isThemeAvailable = (themeId: string) => {
    const theme = availableThemes.find(t => t.id === themeId);
    if (!theme) return false;
    if (!theme.requiresAchievement) return true;
    
    return checkAchievement(theme.achievement);
  };
  
  const isAvatarAvailable = (avatarId: string) => {
    const avatar = availableAvatars.find(a => a.id === avatarId);
    if (!avatar) return false;
    if (!avatar.requiresAchievement) return true;
    
    return checkAchievement(avatar.achievement);
  };

  const isChampionBadgeAvailable = () => {
    return checkAchievement("task-champion");
  };
  
  const convertHexToHSL = (hex: string): string => {
    hex = hex.replace('#', '');
    
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h *= 60;
    }
    
    h = Math.round(h);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
  };
  
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    updateSetting('customColor', newColor);
    document.documentElement.style.setProperty('--primary-hsl', convertHexToHSL(newColor));
  };

  return (
    <div className="space-y-6">
      <Tile title="Theme Settings">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">{t("darkMode")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("toggle")} between light and dark theme
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={settings.darkMode}
              onCheckedChange={(checked) => {
                updateSetting('darkMode', checked);
                if (checked) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              }}
            />
          </div>
          
          <div className="space-y-3">
            <Label>{t("themeColor")}</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {availableThemes.map(theme => (
                theme.id === 'custom' && isThemeAvailable(theme.id) ? (
                  <Popover 
                    key={theme.id} 
                    open={colorPickerOpen && settings.themeColor === 'custom'} 
                    onOpenChange={(open) => {
                      setColorPickerOpen(open);
                      if (open) {
                        updateSetting('themeColor', 'custom');
                        document.documentElement.style.setProperty('--primary-hsl', convertHexToHSL(customColor));
                        document.documentElement.removeAttribute('data-theme');
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className={`relative w-full aspect-square rounded-md border transition-all ${
                          settings.themeColor === theme.id 
                            ? 'ring-2 ring-primary ring-offset-2' 
                            : 'hover:border-primary/50'
                        }`}
                        title="Custom Color - Click to choose any color"
                      >
                        <div 
                          className="w-full h-full rounded-md flex items-center justify-center"
                          style={{ backgroundColor: customColor }}
                        >
                          <Palette className="h-6 w-6 text-white drop-shadow-md" />
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Choose Your Custom Color</h4>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md" style={{ backgroundColor: customColor }}></div>
                          <input 
                            type="color" 
                            value={customColor}
                            onChange={handleCustomColorChange}
                            className="w-full h-8"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <button
                    key={theme.id}
                    onClick={() => {
                      if (isThemeAvailable(theme.id)) {
                        updateSetting('themeColor', theme.id);
                        
                        if (theme.id === 'custom') {
                          document.documentElement.style.setProperty('--primary-hsl', convertHexToHSL(customColor));
                          document.documentElement.removeAttribute('data-theme');
                          setColorPickerOpen(true);
                        } else {
                          document.documentElement.style.removeProperty('--primary-hsl');
                          document.documentElement.setAttribute('data-theme', theme.id);
                          setColorPickerOpen(false);
                        }
                      }
                    }}
                    className={`relative w-full aspect-square rounded-md border transition-all ${
                      settings.themeColor === theme.id 
                        ? 'ring-2 ring-primary ring-offset-2' 
                        : isThemeAvailable(theme.id) ? 'hover:border-primary/50' : 'opacity-40 cursor-not-allowed'
                    }`}
                    disabled={!isThemeAvailable(theme.id)}
                    title={
                      !isThemeAvailable(theme.id) && theme.requiresAchievement
                        ? `Unlock the ${theme.name} theme by completing the ${
                            achievements.find(a => a.id === theme.achievement)?.name
                          } achievement`
                        : theme.name
                    }
                  >
                    <div 
                      className={`w-full h-full rounded-md ${
                        theme.id === 'blue' ? 'bg-blue-500' :
                        theme.id === 'green' ? 'bg-green-500' :
                        theme.id === 'purple' ? 'bg-purple-500' :
                        theme.id === 'morning' ? 'bg-gradient-to-br from-orange-300 to-yellow-500' :
                        theme.id === 'night' ? 'bg-gradient-to-br from-indigo-900 to-purple-900' :
                        theme.id === 'gold' ? 'bg-gradient-to-br from-yellow-300 to-amber-500' :
                        'bg-gray-500'
                      }`}
                    ></div>
                    {!isThemeAvailable(theme.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                )
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Some themes require achievements to unlock
            </p>
          </div>
          
          <div className="space-y-3">
            <Label>{t("language")}</Label>
            <Select
              value={settings.language}
              onValueChange={(value) => updateSetting('language', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="spanish">Español</SelectItem>
                <SelectItem value="french">Français</SelectItem>
                <SelectItem value="german">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Tile>
      
      <Tile title="Avatar">
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {availableAvatars.map(avatar => (
              <button
                key={avatar.id}
                onClick={() => isAvatarAvailable(avatar.id) && updateSetting('avatar', avatar.id)}
                className={`relative rounded-full aspect-square border overflow-hidden ${
                  !isAvatarAvailable(avatar.id) ? 'opacity-40 cursor-not-allowed' : 
                  settings.avatar === avatar.id ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                disabled={!isAvatarAvailable(avatar.id)}
                title={
                  !isAvatarAvailable(avatar.id) 
                    ? `Unlock by completing achievement` 
                    : avatar.name
                }
              >
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  {avatar.id === 'default' && <User className="h-8 w-8 text-primary/60" />}
                  {avatar.id === 'zen' && <div className="text-2xl">🧘</div>}
                  {avatar.id === 'productivity' && <div className="text-2xl">⚡</div>}
                  {avatar.id === 'crown' && <div className="text-2xl">👑</div>}
                </div>
                {!isAvatarAvailable(avatar.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Additional avatars are unlocked by earning achievements
          </p>
        </div>
      </Tile>
      
      <Tile title="Badges">
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground mb-4">
            Display badges next to your avatar to showcase your achievements
          </p>
          
          <div className="space-y-4 border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Champion Badge</h3>
                <p className="text-xs text-muted-foreground">Show your Champion badge next to your avatar</p>
              </div>
              
              <Switch
                checked={isChampionBadgeAvailable() ? (settings.showChampionBadge || false) : false}
                onCheckedChange={(checked) => {
                  if (isChampionBadgeAvailable()) {
                    updateSetting('showChampionBadge', checked);
                  }
                }}
                disabled={!isChampionBadgeAvailable()}
              />
            </div>
            
            {!isChampionBadgeAvailable() && (
              <div className="bg-muted/40 p-3 rounded-md flex items-center text-sm">
                <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">Complete the Task Champion achievement to unlock</span>
              </div>
            )}
            
            {isChampionBadgeAvailable() && (
              <div className="bg-muted/40 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <ChampionBadge />
                  <span className="text-sm font-medium">Preview</span>
                </div>
                <p className="text-xs text-muted-foreground">This badge will appear next to your avatar in the application</p>
              </div>
            )}
          </div>
          
          <div className="bg-muted/20 p-4 rounded-md text-center">
            <p className="text-sm text-muted-foreground">More badges will be available as you complete achievements</p>
          </div>
        </div>
      </Tile>
    </div>
  );
};

export default AppearanceSettings;
