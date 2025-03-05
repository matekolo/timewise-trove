import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  darkMode: boolean;
  themeColor: string;
  language: string;
  avatar: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
  achievementNotifications: boolean;
  showChampionBadge: boolean;
  notifications: boolean;
  soundEffects: boolean;
  dailyReminderTime: string;
  customThemeColors: boolean;
  customColor: string;
}

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>({
    darkMode: false,
    themeColor: 'blue',
    language: 'english',
    avatar: 'default',
    notificationsEnabled: true,
    emailNotifications: false,
    soundEnabled: true,
    achievementNotifications: true,
    showChampionBadge: false,
    notifications: false,
    soundEffects: false,
    dailyReminderTime: '09:00',
    customThemeColors: false,
    customColor: '#3b82f6',
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

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

  const loadUserAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userAchievements, error } = await supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", user.id)
          .eq("claimed", true);
          
        if (!error && userAchievements) {
          const achievementIds = userAchievements.map(a => a.achievement_id);
          setUnlockedAchievements(achievementIds);
          
          const savedSettings = localStorage.getItem('user-settings');
          if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            
            if (parsedSettings.avatar === 'crown' && !achievementIds.includes('consistency-king')) {
              updateSetting('avatar', 'default');
            }
            
            if (parsedSettings.showChampionBadge && !achievementIds.includes('task-champion')) {
              updateSetting('showChampionBadge', false);
            }
          }
          
          return achievementIds;
        }
      }
      return [];
    } catch (error) {
      console.error("Error loading user achievements:", error);
      return [];
    }
  };

  const hasAchievement = (achievementId: string): boolean => {
    return unlockedAchievements.includes(achievementId);
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem('user-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings
        }));
        
        if (parsedSettings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        if (parsedSettings.themeColor === 'custom' && parsedSettings.customColor) {
          document.documentElement.style.setProperty('--primary-hsl', convertHexToHSL(parsedSettings.customColor));
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.style.removeProperty('--primary-hsl');
          document.documentElement.setAttribute('data-theme', parsedSettings.themeColor || 'blue');
        }
        
        loadUserAchievements();
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings(prev => {
      if (key === 'avatar') {
        if (value === 'crown' && !hasAchievement('consistency-king')) {
          console.warn("Cannot set crown avatar without consistency-king achievement");
          return prev;
        }
      }
      
      if (key === 'showChampionBadge' && value === true) {
        if (!hasAchievement('task-champion')) {
          console.warn("Cannot enable champion badge without task-champion achievement");
          return prev;
        }
      }
      
      const newSettings = { ...prev, [key]: value };
      
      localStorage.setItem('user-settings', JSON.stringify(newSettings));
      
      window.dispatchEvent(new Event('settings-updated'));
      
      if (key === 'darkMode') {
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      if (key === 'themeColor') {
        if (value === 'custom') {
          document.documentElement.style.setProperty('--primary-hsl', convertHexToHSL(newSettings.customColor));
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.style.removeProperty('--primary-hsl');
          document.documentElement.setAttribute('data-theme', value);
        }
      }
      
      if (key === 'customColor' && newSettings.themeColor === 'custom') {
        document.documentElement.style.setProperty('--primary-hsl', convertHexToHSL(value));
      }
      
      return newSettings;
    });
  };

  const saveUserProfile = async (displayName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase.auth.updateUser({
          data: { name: displayName }
        });
        
        if (error) {
          console.error('Error updating user profile:', error);
          return false;
        }
        
        return true;
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
    
    return false;
  };

  return { 
    settings, 
    updateSetting, 
    saveUserProfile, 
    hasAchievement,
    refreshAchievements: loadUserAchievements
  };
};
