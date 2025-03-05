
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

  // Convert hex color to HSL format for CSS variables
  const convertHexToHSL = (hex: string): string => {
    // Remove the # if present
    hex = hex.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // Find max and min RGB values
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
    
    // Round values 
    h = Math.round(h);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
  };

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
        
        // Apply theme settings
        if (parsedSettings.themeColor === 'custom' && parsedSettings.customColor) {
          // Apply custom color directly using CSS variable
          document.documentElement.style.setProperty('--primary-hsl', convertHexToHSL(parsedSettings.customColor));
          document.documentElement.removeAttribute('data-theme');
        } else {
          // Apply standard theme
          document.documentElement.style.removeProperty('--primary-hsl');
          document.documentElement.setAttribute('data-theme', parsedSettings.themeColor || 'blue');
        }
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
        if (value === 'custom') {
          // Apply custom color
          document.documentElement.style.setProperty('--primary-hsl', convertHexToHSL(newSettings.customColor));
          document.documentElement.removeAttribute('data-theme');
        } else {
          // Apply standard theme
          document.documentElement.style.removeProperty('--primary-hsl');
          document.documentElement.setAttribute('data-theme', value);
        }
      }
      
      if (key === 'customColor' && newSettings.themeColor === 'custom') {
        // Apply the custom color if we're in custom theme mode
        document.documentElement.style.setProperty('--primary-hsl', convertHexToHSL(value));
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
