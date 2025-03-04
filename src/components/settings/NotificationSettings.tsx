
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Tile from "@/components/ui/Tile";
import { useLanguage } from "@/contexts/LanguageContext"; 
import { UserSettings } from "@/hooks/useUserSettings";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

interface NotificationSettingsProps {
  settings: UserSettings;
  updateSetting: (key: keyof UserSettings, value: any) => void;
}

const NotificationSettings = ({ settings, updateSetting }: NotificationSettingsProps) => {
  const { t } = useLanguage();
  const [notificationSupported, setNotificationSupported] = useState(true);
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
    }
    
    return () => {
      // Clear any timeouts when component unmounts
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [t]);

  // Schedule daily reminder
  useEffect(() => {
    if (settings.notifications && settings.dailyReminderTime) {
      scheduleReminderNotification();
    }
    
    // Cleanup previous schedule
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [settings.notifications, settings.dailyReminderTime]);

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
        const permission = await Notification.requestPermission();
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
          toast({
            title: t("notificationsBlocked"),
            description: t("notificationsBlockedDesc"),
            variant: "destructive",
          });
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
    if (settings.notifications) {
      // Reschedule notification with new time
      scheduleReminderNotification();
      
      toast({
        title: t("reminderSet"),
        description: t("reminderSetDesc").replace('{time}', time),
      });
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
        
        {/* Test button for notifications */}
        {settings.notifications && (
          <div className="pt-4">
            <button 
              onClick={triggerTestNotification}
              className="text-sm text-primary underline"
            >
              Send test notification
            </button>
          </div>
        )}
      </div>
    </Tile>
  );
};

export default NotificationSettings;
