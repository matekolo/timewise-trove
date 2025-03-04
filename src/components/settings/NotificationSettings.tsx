import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Tile from "@/components/ui/Tile";
import { useLanguage } from "@/contexts/LanguageContext"; 
import { UserSettings } from "@/hooks/useUserSettings";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface NotificationSettingsProps {
  settings: UserSettings;
  updateSetting: (key: keyof UserSettings, value: any) => void;
}

const NotificationSettings = ({ settings, updateSetting }: NotificationSettingsProps) => {
  const { t } = useLanguage();
  const [notificationSupported, setNotificationSupported] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);
  const [taskNotificationTimeoutsIds, setTaskNotificationTimeoutsIds] = useState<Record<string, number>>({});

  const { data: upcomingTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ["upcoming-tasks"],
    queryFn: async () => {
      if (!settings.notifications || notificationPermission !== "granted") return [];
      
      try {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("completed", false)
          .not("time", "is", null);
        
        if (error) {
          console.error("Error fetching upcoming tasks:", error);
          return [];
        }
        
        console.log("Fetched upcoming tasks:", data);
        return data || [];
      } catch (err) {
        console.error("Error in queryFn for upcoming-tasks:", err);
        return [];
      }
    },
    enabled: settings.notifications && notificationPermission === "granted",
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationSupported(false);
      toast({
        title: t("notificationsNotSupported"),
        description: t("notificationsNotSupportedDesc"),
        variant: "destructive",
      });
      return;
    }
    
    setNotificationPermission(Notification.permission);
    
    if (Notification.permission === "granted" && !settings.notifications) {
      updateSetting('notifications', true);
    }
    
    if (Notification.permission === "denied" && settings.notifications) {
      updateSetting('notifications', false);
      toast({
        title: "Notification Permission Denied",
        description: "Please enable notifications in your browser settings to use this feature.",
        variant: "destructive",
      });
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      Object.values(taskNotificationTimeoutsIds).forEach(id => {
        clearTimeout(id);
      });
    };
  }, [t, settings.notifications, updateSetting]);

  useEffect(() => {
    if (settings.notifications && settings.dailyReminderTime && notificationPermission === "granted") {
      scheduleReminderNotification();
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [settings.notifications, settings.dailyReminderTime, notificationPermission]);

  useEffect(() => {
    if (settings.notifications && notificationPermission === "granted" && upcomingTasks.length > 0) {
      // Clear existing timeouts
      Object.values(taskNotificationTimeoutsIds).forEach(id => {
        clearTimeout(id);
      });
      
      const newTimeoutIds: Record<string, number> = {};
      
      upcomingTasks.forEach(task => {
        if (task.time) {
          try {
            const taskTime = new Date(task.time);
            const now = new Date();
            const timeDiff = taskTime.getTime() - now.getTime();
            
            // If the task is due within the next 24 hours
            if (timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000) {
              console.log(`Scheduling notification for task "${task.title}" in ${Math.round(timeDiff/1000/60)} minutes`);
              
              const id = window.setTimeout(() => {
                triggerTaskNotification(task);
              }, timeDiff);
              
              newTimeoutIds[task.id] = id;
            }
            // Check for tasks that are very slightly overdue (within the last 15 minutes)
            else if (timeDiff > -15 * 60 * 1000 && timeDiff <= 0) {
              console.log(`Task "${task.title}" is slightly overdue, triggering notification now`);
              triggerTaskNotification(task);
            }
          } catch (err) {
            console.error(`Error scheduling notification for task "${task.title}":`, err);
          }
        }
      });
      
      setTaskNotificationTimeoutsIds(newTimeoutIds);
    }
    
    return () => {
      Object.values(taskNotificationTimeoutsIds).forEach(id => {
        clearTimeout(id);
      });
    };
  }, [settings.notifications, notificationPermission, upcomingTasks]);

  const scheduleReminderNotification = () => {
    if (settings.notifications && settings.dailyReminderTime && notificationPermission === "granted") {
      const [hours, minutes] = settings.dailyReminderTime.split(':').map(Number);
      const now = new Date();
      const reminderDate = new Date();
      reminderDate.setHours(hours, minutes, 0, 0);
      
      if (reminderDate <= now) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
      
      const delay = reminderDate.getTime() - now.getTime();
      
      const formattedTime = reminderDate.toLocaleTimeString();
      console.log(`Notification scheduled for: ${formattedTime} (in ${Math.round(delay/1000/60)} minutes)`);
      
      const id = window.setTimeout(() => {
        triggerNotification();
        scheduleReminderNotification();
      }, delay);
      
      setTimeoutId(id);
    }
  };

  const triggerNotification = () => {
    console.log("Triggering daily reminder notification");
    if (Notification.permission === "granted" && settings.notifications) {
      const notification = new Notification("Timewise Daily Reminder", {
        body: "It's time to check your tasks and habits for today!",
        icon: "/favicon.ico"
      });
      
      if (settings.soundEffects) {
        const audio = new Audio("/notification-sound.mp3");
        audio.play().catch(console.error);
      }
      
      toast({
        title: "Daily Reminder",
        description: "It's time to check your tasks and habits for today!",
      });
    }
  };

  const triggerTaskNotification = (task: any) => {
    console.log("Triggering task notification for:", task.title);
    if (Notification.permission === "granted" && settings.notifications) {
      try {
        const notification = new Notification("Task Reminder", {
          body: `It's time for: ${task.title}`,
          icon: "/favicon.ico"
        });
        
        if (settings.soundEffects) {
          const audio = new Audio("/notification-sound.mp3");
          audio.play().catch(err => console.error("Error playing sound:", err));
        }
        
        toast({
          title: "Task Reminder",
          description: `It's time for: ${task.title}`,
        });
      } catch (err) {
        console.error("Error triggering task notification:", err);
      }
    }
  };

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
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
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
