
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Tile from "@/components/ui/Tile";
import { useLanguage } from "@/contexts/LanguageContext"; 
import { UserSettings } from "@/hooks/useUserSettings";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface NotificationSettingsProps {
  settings: UserSettings;
  updateSetting: (key: keyof UserSettings, value: any) => void;
}

const NotificationSettings = ({ settings, updateSetting }: NotificationSettingsProps) => {
  const { t } = useLanguage();
  const [notificationSupported, setNotificationSupported] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    if (!("Notification" in window)) {
      setNotificationSupported(false);
      toast({
        title: t("notificationsNotSupported"),
        description: t("notificationsNotSupportedDesc"),
        variant: "destructive",
      });
      return;
    }
    
    // Get the current permission state
    setNotificationPermission(Notification.permission);
    
    // If notification permission was previously granted but settings has it disabled,
    // update the settings to match reality
    if (Notification.permission === "granted" && !settings.notifications) {
      updateSetting('notifications', true);
    }
    
    // If notification permission was previously denied but settings has it enabled,
    // update the settings to match reality
    if (Notification.permission === "denied" && settings.notifications) {
      updateSetting('notifications', false);
      toast({
        title: "Notification Permission Denied",
        description: "Please enable notifications in your browser settings to use this feature.",
        variant: "destructive",
      });
    }
    
    return () => {
      // Clear any timeouts when component unmounts
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [t, settings.notifications, updateSetting]);

  // Schedule daily reminder
  useEffect(() => {
    if (settings.notifications && settings.dailyReminderTime && notificationPermission === "granted") {
      scheduleReminderNotification();
    }
    
    // Cleanup previous schedule
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [settings.notifications, settings.dailyReminderTime, notificationPermission]);

  const scheduleReminderNotification = () => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Get current time and reminder time
    const [hours, minutes] = settings.dailyReminderTime.split(':').map(Number);
    const now = new Date();
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);
    
    // If reminder time is earlier than current time, schedule for next day
    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }
    
    // Calculate delay until reminder time
    const delay = reminderDate.getTime() - now.getTime();
    
    // For testing - show when the notification will fire
    const formattedTime = reminderDate.toLocaleTimeString();
    console.log(`Notification scheduled for: ${formattedTime} (in ${Math.round(delay/1000/60)} minutes)`);
    
    // Schedule notification
    const id = window.setTimeout(() => {
      triggerNotification();
      // Reschedule for next day
      scheduleReminderNotification();
    }, delay);
    
    setTimeoutId(id);
  };

  const triggerNotification = () => {
    if (Notification.permission === "granted" && settings.notifications) {
      const notification = new Notification("Timewise Daily Reminder", {
        body: "It's time to check your tasks and habits for today!",
        icon: "/favicon.ico"
      });
      
      // Play sound if enabled
      if (settings.soundEffects) {
        const audio = new Audio("/notification-sound.mp3");
        audio.play().catch(console.error);
      }
      
      // Show toast as a fallback
      toast({
        title: "Daily Reminder",
        description: "It's time to check your tasks and habits for today!",
      });
    }
  };

  const handleNotificationChange = async (checked: boolean) => {
    if (checked) {
      try {
        // Request permission if not already granted
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === "granted") {
          updateSetting('notifications', true);
          toast({
            title: t("notificationsEnabled"),
            description: t("notificationsEnabledDesc"),
          });
          
          // Schedule the reminder immediately if time is set
          if (settings.dailyReminderTime) {
            scheduleReminderNotification();
          }
        } else {
          // Permission was denied
          toast({
            title: t("notificationsBlocked"),
            description: t("notificationsBlockedDesc"),
            variant: "destructive",
          });
          // Don't enable notifications setting if permission was denied
          updateSetting('notifications', false);
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        toast({
          title: t("error"),
          description: t("notificationError"),
          variant: "destructive",
        });
      }
    } else {
      updateSetting('notifications', false);
      // Clear any scheduled notifications
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
  };

  const handleSoundEffectChange = (checked: boolean) => {
    updateSetting('soundEffects', checked);
    if (checked) {
      // Play a test sound
      const audio = new Audio("/notification-sound.mp3");
      audio.play().catch(error => {
        console.error("Error playing notification sound:", error);
        toast({
          title: "Audio Error",
          description: "There was an error playing the notification sound. Make sure the file exists at /public/notification-sound.mp3",
          variant: "destructive",
        });
      });
    }
  };

  const handleReminderTimeChange = (time: string) => {
    updateSetting('dailyReminderTime', time);
    if (settings.notifications && notificationPermission === "granted") {
      // Reschedule notification with new time
      scheduleReminderNotification();
      
      toast({
        title: t("reminderSet"),
        description: t("reminderSetDesc").replace('{time}', time),
      });
    }
  };

  // Function to reset notification permissions
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === "granted") {
          updateSetting('notifications', true);
          toast({
            title: "Notifications Enabled",
            description: "You will now receive notifications from the app.",
          });
          
          // Schedule the reminder immediately if time is set
          if (settings.dailyReminderTime) {
            scheduleReminderNotification();
          }
        } else {
          toast({
            title: "Notification Permission Denied",
            description: "Please enable notifications in your browser settings to use this feature.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        toast({
          title: "Error",
          description: "There was an error requesting notification permission.",
          variant: "destructive",
        });
      }
    }
  };

  // For testing - add a button to trigger a test notification
  const triggerTestNotification = () => {
    if (Notification.permission === "granted" && settings.notifications) {
      const notification = new Notification("Test Notification", {
        body: "This is a test notification from Timewise",
        icon: "/favicon.ico"
      });
      
      // Play sound if enabled
      if (settings.soundEffects) {
        const audio = new Audio("/notification-sound.mp3");
        audio.play().catch(console.error);
      }
      
      toast({
        title: "Test Notification Sent",
        description: "If you didn't see a notification, check your browser settings.",
      });
    } else {
      toast({
        title: "Notification Error",
        description: "Notifications are not enabled or permission was denied",
        variant: "destructive",
      });
    }
  };

  return (
    <Tile title={t("notificationSettings")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">{t("notifications")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("notificationsDesc")}
            </p>
          </div>
          <Switch
            id="notifications"
            checked={settings.notifications}
            onCheckedChange={handleNotificationChange}
            disabled={!notificationSupported}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sound-effects">{t("soundEffects")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("soundEffectsDesc")}
            </p>
          </div>
          <Switch
            id="sound-effects"
            checked={settings.soundEffects}
            onCheckedChange={handleSoundEffectChange}
          />
        </div>
        
        <div className="space-y-3">
          <Label>{t("dailyReminder")}</Label>
          <Input 
            type="time" 
            value={settings.dailyReminderTime}
            onChange={(e) => handleReminderTimeChange(e.target.value)}
            disabled={!settings.notifications}
          />
          <p className="text-xs text-muted-foreground">
            {settings.notifications ? t("dailyReminderDesc") : t("enableNotificationsFirst")}
          </p>
        </div>
        
        {/* Notification permission status */}
        <div className="pt-2 pb-1 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium">Notification Permission: {notificationPermission || "unknown"}</p>
          {notificationPermission === "denied" && (
            <p className="text-xs text-red-500 mt-1">
              Notifications are blocked by your browser. Please update your browser settings to allow notifications.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={requestNotificationPermission}
          >
            Request Permission
          </Button>
          
          {notificationPermission === "granted" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={triggerTestNotification}
            >
              Send Test Notification
            </Button>
          )}
        </div>
      </div>
    </Tile>
  );
};

export default NotificationSettings;
