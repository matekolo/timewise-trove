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
    { id: "productivity", name: "Productivity Pro", requiresAchievement: true, achievement: "focus-master" },
    { id: "champion", name: "Champion", requiresAchievement: true, achievement: "task-champion" }
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
                // Immediately apply the dark mode change to ensure it persists across reloads
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
                  {avatar.id === 'champion' && <Award className="h-8 w-8 text-primary/60" />}
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
          
          <div className="pt-4">
            <h3 className="text-sm font-semibold mb-3">Current Avatar</h3>
            <div className="flex items-center gap-3">
              <UserAvatar size="lg" />
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{
                  settings.avatar === 'default' ? 'Default Avatar' :
                  settings.avatar === 'zen' ? 'Zen Master' : 
                  settings.avatar === 'productivity' ? 'Productivity Pro' :
                  settings.avatar === 'champion' ? 'Champion' :
                  'Custom Avatar'
                }</p>
                {settings.avatar === 'champion' && (
                  <ChampionBadge className="mt-1" />
                )}
              </div>
            </div>
          </div>
        </div>
      </Tile>
    </div>
  );
};

export default AppearanceSettings;
