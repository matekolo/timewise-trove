
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  darkMode: boolean;
  notifications: boolean;
  soundEffects: boolean;
  language: string;
  themeColor: string;
  avatar: string;
  dailyReminderTime: string;
}

// Default settings
export const defaultSettings: UserSettings = {
  darkMode: false,
  notifications: true,
  soundEffects: true,
  language: "english",
  themeColor: "blue",
  avatar: "default",
  dailyReminderTime: "08:00"
};

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('user-settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
          applySettings(parsedSettings);
        } else {
          // If no settings found, save and apply defaults
          localStorage.setItem('user-settings', JSON.stringify(defaultSettings));
          applySettings(defaultSettings);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        // Fallback to defaults if there's an error
        localStorage.setItem('user-settings', JSON.stringify(defaultSettings));
        applySettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    // Add event listener for DOM content loaded to ensure 
    // dark mode is correctly applied on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadSettings);
    } else {
      loadSettings();
    }

    // Listen for storage events (when settings are updated from another tab)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'user-settings' && event.newValue) {
        const newSettings = JSON.parse(event.newValue);
        setSettings(newSettings);
        applySettings(newSettings);
      }
    };

    // Also listen for custom settings-updated event
    const handleSettingsUpdate = () => {
      const savedSettings = localStorage.getItem('user-settings');
      if (savedSettings) {
        const newSettings = JSON.parse(savedSettings);
        setSettings(newSettings);
        applySettings(newSettings);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settings-updated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settings-updated', handleSettingsUpdate);
      if (document.readyState === 'loading') {
        document.removeEventListener('DOMContentLoaded', loadSettings);
      }
    };
  }, []);

  // Apply settings to the app
  const applySettings = (settingsToApply: UserSettings) => {
    // Apply dark mode
    if (settingsToApply.darkMode) {
      document.documentElement.classList.add('dark');
      // Explicitly store the preference in localStorage as well
      localStorage.setItem('theme-mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme-mode', 'light');
    }
    
    // Apply theme color
    const applyThemeColor = (color: string) => {
      // Remove any existing theme classes
      document.documentElement.classList.remove(
        'theme-blue', 'theme-green', 'theme-purple', 
        'theme-morning', 'theme-night', 'theme-gold'
      );
      
      // Add the new theme class
      document.documentElement.classList.add(`theme-${color}`);
    };
    
    applyThemeColor(settingsToApply.themeColor);
    
    // Schedule daily reminder if enabled
    if (settingsToApply.notifications && settingsToApply.dailyReminderTime) {
      scheduleReminderNotification(settingsToApply.dailyReminderTime);
    }
    
    // Log for debugging
    console.log("Settings applied:", settingsToApply);
  };

  // Schedule daily reminder notification
  const scheduleReminderNotification = (reminderTime: string) => {
    // Clear any existing scheduled notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Get current time and reminder time
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const now = new Date();
      const reminderDate = new Date();
      reminderDate.setHours(hours, minutes, 0, 0);
      
      // If reminder time is earlier than current time, schedule for next day
      if (reminderDate <= now) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
      
      // Calculate delay until reminder time
      const delay = reminderDate.getTime() - now.getTime();
      
      // Schedule notification
      setTimeout(() => {
        if (Notification.permission === "granted") {
          const notification = new Notification("Timewise Daily Reminder", {
            body: "It's time to check your tasks and habits for today!",
            icon: "/favicon.ico"
          });
          
          // Play sound if enabled
          if (settings.soundEffects) {
            const audio = new Audio("/notification-sound.mp3");
            audio.play().catch(console.error);
          }
        }
        // Reschedule for next day
        scheduleReminderNotification(reminderTime);
      }, delay);
    }
  };

  // Update a single setting
  const updateSetting = (key: keyof UserSettings, value: any) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    localStorage.setItem('user-settings', JSON.stringify(updatedSettings));
    applySettings(updatedSettings);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('settings-updated'));
  };

  // Save user profile to Supabase
  const saveUserProfile = async (displayName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase.auth.updateUser({
        data: { name: displayName }
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error saving user profile:", error);
      return { success: false, error };
    }
  };

  return {
    settings,
    loading,
    updateSetting,
    saveUserProfile
  };
};
