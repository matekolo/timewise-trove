
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, User, Award } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { UserSettings } from "@/hooks/useUserSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import UserAvatar from "@/components/ui/UserAvatar";
import ChampionBadge from "@/components/ui/ChampionBadge";

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
}

const AppearanceSettings = ({ 
  settings, 
  updateSetting, 
  displayName, 
  achievements 
}: AppearanceSettingsProps) => {
  const { t } = useLanguage();
  
  const availableThemes = [
    { id: "blue", name: "Default Blue", requiresAchievement: false },
    { id: "green", name: "Forest Green", requiresAchievement: false },
    { id: "purple", name: "Royal Purple", requiresAchievement: false },
    { id: "morning", name: "Morning Sunrise", requiresAchievement: true, achievement: "early-bird" },
    { id: "night", name: "Night Owl", requiresAchievement: true, achievement: "night-owl" },
    { id: "gold", name: "Gold Theme", requiresAchievement: true, achievement: "streak-master" }
  ];
  
  const availableAvatars = [
    { id: "default", name: "Default", requiresAchievement: false },
    { id: "zen", name: "Zen Master", requiresAchievement: true, achievement: "zen-mind" },
    { id: "productivity", name: "Productivity Pro", requiresAchievement: true, achievement: "focus-master" }
  ];
  
  // Custom theme colors that are unlocked with the Habit Breaker achievement
  const customColors = [
    { id: "teal", name: "Teal", color: "bg-teal-500" },
    { id: "amber", name: "Amber", color: "bg-amber-500" },
    { id: "rose", name: "Rose", color: "bg-rose-500" },
    { id: "cyan", name: "Cyan", color: "bg-cyan-500" },
    { id: "emerald", name: "Emerald", color: "bg-emerald-500" },
    { id: "indigo", name: "Indigo", color: "bg-indigo-500" }
  ];
  
  const isThemeAvailable = (themeId: string) => {
    const theme = availableThemes.find(t => t.id === themeId);
    if (!theme) return false;
    if (!theme.requiresAchievement) return true;
    
    return achievements.some(a => 
      a.id === theme.achievement && a.unlocked
    );
  };
  
  const isAvatarAvailable = (avatarId: string) => {
    const avatar = availableAvatars.find(a => a.id === avatarId);
    if (!avatar) return false;
    if (!avatar.requiresAchievement) return true;
    
    return achievements.some(a => 
      a.id === avatar.achievement && a.unlocked
    );
  };

  const isChampionBadgeAvailable = () => {
    return achievements.some(a => 
      a.id === "task-champion" && a.unlocked
    );
  };
  
  const isCustomThemeColorsAvailable = () => {
    // Check both the achievement unlock status and the settings flag
    return settings.customThemeColors || achievements.some(a => 
      a.id === "habit-breaker" && a.unlocked
    );
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
                <button
                  key={theme.id}
                  onClick={() => isThemeAvailable(theme.id) && updateSetting('themeColor', theme.id)}
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
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Some themes require achievements to unlock
            </p>
          </div>
          
          {/* Custom Theme Colors Section */}
          {isCustomThemeColorsAvailable() && (
            <div className="space-y-3 mt-6 border-t pt-4">
              <Label>Custom Theme Colors</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Unlocked by completing the Habit Breaker achievement
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {customColors.map(color => (
                  <button
                    key={color.id}
                    onClick={() => updateSetting('themeColor', color.id)}
                    className={`relative w-full aspect-square rounded-md border transition-all ${
                      settings.themeColor === color.id 
                        ? 'ring-2 ring-primary ring-offset-2' 
                        : 'hover:border-primary/50'
                    }`}
                    title={color.name}
                  >
                    <div className={`w-full h-full rounded-md ${color.color}`}></div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
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
          
          {/* Champion Badge Option */}
          <div className="space-y-4 border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Champion Badge</h3>
                <p className="text-xs text-muted-foreground">Show your Champion badge next to your avatar</p>
              </div>
              
              <Switch
                checked={settings.showChampionBadge || false}
                onCheckedChange={(checked) => updateSetting('showChampionBadge', checked)}
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
          
          {/* Future badges will be added here */}
          <div className="bg-muted/20 p-4 rounded-md text-center">
            <p className="text-sm text-muted-foreground">More badges will be available as you complete achievements</p>
          </div>
        </div>
      </Tile>
    </div>
  );
};

export default AppearanceSettings;
