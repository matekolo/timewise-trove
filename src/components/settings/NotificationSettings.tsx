
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Tile from "@/components/ui/Tile";
import { useLanguage } from "@/contexts/LanguageContext"; 
import { UserSettings } from "@/hooks/useUserSettings";
import { toast, notificationExists } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/NotificationContext";

interface NotificationSettingsProps {
  settings: UserSettings;
  updateSetting: (key: keyof UserSettings, value: any) => void;
}

const NotificationSettings = ({ settings, updateSetting }: NotificationSettingsProps) => {
  const { t } = useLanguage();
  const [notificationSupported, setNotificationSupported] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const { scheduleReminderNotification, scheduleTaskNotifications } = useNotifications();

  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationSupported(false);
      if (!notificationExists(t("notificationsNotSupported"), t("notificationsNotSupportedDesc"))) {
        toast({
          title: t("notificationsNotSupported"),
          description: t("notificationsNotSupportedDesc"),
          variant: "destructive",
        });
      }
      return;
    }
    
    setNotificationPermission(Notification.permission);
    
    if (Notification.permission === "granted" && !settings.notifications) {
      updateSetting('notifications', true);
    }
    
    if (Notification.permission === "denied" && settings.notifications) {
      updateSetting('notifications', false);
      if (!notificationExists("Notification Permission Denied", "Please enable notifications in your browser settings to use this feature.")) {
        toast({
          title: "Notification Permission Denied",
          description: "Please enable notifications in your browser settings to use this feature.",
          variant: "destructive",
        });
      }
    }
  }, [t, settings.notifications, updateSetting]);

  const handleNotificationChange = async (checked: boolean) => {
    if (checked) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === "granted") {
          updateSetting('notifications', true);
          toast({
            title: t("notificationsEnabled"),
            description: t("notificationsEnabledDesc"),
          });
          
          if (settings.dailyReminderTime) {
            scheduleReminderNotification();
          }
          
          // Schedule task notifications
          scheduleTaskNotifications();
        } else {
          toast({
            title: t("notificationsBlocked"),
            description: t("notificationsBlockedDesc"),
            variant: "destructive",
          });
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
    }
  };

  const handleSoundEffectChange = (checked: boolean) => {
    updateSetting('soundEffects', checked);
    if (checked) {
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
      scheduleReminderNotification();
      
      toast({
        title: t("reminderSet"),
        description: t("reminderSetDesc").replace('{time}', time),
      });
    }
  };

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
          
          if (settings.dailyReminderTime) {
            scheduleReminderNotification();
          }
          
          // Schedule task notifications
          scheduleTaskNotifications();
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
        </div>
      </div>
    </Tile>
  );
};

export default NotificationSettings;
