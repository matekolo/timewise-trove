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
  // ... other settings 
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
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('user-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings
        }));
        
        // Apply dark mode from saved settings
        if (parsedSettings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Apply theme color
        document.documentElement.setAttribute('data-theme', parsedSettings.themeColor || 'blue');
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  // Update a single setting
  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Save to localStorage
      localStorage.setItem('user-settings', JSON.stringify(newSettings));
      
      // Dispatch event for other components to listen for
      window.dispatchEvent(new Event('settings-updated'));
      
      // Apply theme changes immediately
      if (key === 'darkMode') {
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      if (key === 'themeColor') {
        document.documentElement.setAttribute('data-theme', value);
      }
      
      return newSettings;
    });
  };
  
  // Save user profile to Supabase
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

  return { settings, updateSetting, saveUserProfile };
};
