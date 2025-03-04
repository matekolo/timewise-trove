
import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserSettings } from "@/hooks/useUserSettings";
import { showNotificationToast, showErrorToast, showSuccessToast } from "@/utils/toastUtils";

export const useNotifications = (settings: UserSettings, updateSetting: (key: keyof UserSettings, value: any) => void) => {
  const queryClient = useQueryClient();
  const [notificationSupported, setNotificationSupported] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);
  const [taskNotificationTimeoutsIds, setTaskNotificationTimeoutsIds] = useState<Record<string, number>>({});

  const { data: upcomingTasks = [] } = useQuery({
    queryKey: ["upcoming-tasks"],
    queryFn: async () => {
      console.log("Fetching upcoming tasks for notifications");
      if (!settings.notifications || notificationPermission !== "granted") {
        console.log("Notifications disabled or permission not granted, skipping task fetch");
        return [];
      }
      
      const now = new Date();
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("completed", false)
        .not("time", "is", null)
        .gte("time", now.toISOString()) 
        .lt("time", tomorrow.toISOString());
      
      if (error) {
        console.error("Error fetching upcoming tasks:", error);
        return [];
      }
      
      console.log(`Fetched ${data?.length || 0} tasks for notifications, time range: ${now.toISOString()} to ${tomorrow.toISOString()}`);
      
      if (data && data.length > 0) {
        data.forEach(task => {
          const taskTime = new Date(task.time);
          const minutesToGo = Math.round((taskTime.getTime() - now.getTime()) / (60 * 1000));
          console.log(`Task "${task.title}" is scheduled for ${taskTime.toLocaleString()} (${minutesToGo} minutes from now)`);
        });
      }
      
      return data || [];
    },
    enabled: settings.notifications && notificationPermission === "granted",
    refetchInterval: 60000,
    staleTime: 30000,
  });

  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationSupported(false);
      showErrorToast(
        "Notifications Not Supported", 
        "Your browser does not support notifications"
      );
      return;
    }
    
    setNotificationPermission(Notification.permission);
    
    if (Notification.permission === "granted" && !settings.notifications) {
      updateSetting('notifications', true);
    }
    
    if (Notification.permission === "denied" && settings.notifications) {
      updateSetting('notifications', false);
      showErrorToast(
        "Notification Permission Denied", 
        "Please enable notifications in your browser settings to use this feature."
      );
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      Object.values(taskNotificationTimeoutsIds).forEach(id => {
        clearTimeout(id);
      });
    };
  }, [settings.notifications, updateSetting]);

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

  const triggerTaskNotification = useCallback((task: any) => {
    console.log(`Triggering notification for task: ${task.title}`);
    
    if (Notification.permission === "granted" && settings.notifications) {
      try {
        const uniqueTag = `task-${task.id}-${Date.now()}`;
        console.log(`Creating notification with tag: ${uniqueTag}`);
        
        const notification = new Notification("Task Reminder", {
          body: `It's time for: ${task.title}`,
          icon: "/favicon.ico",
          tag: uniqueTag
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        if (settings.soundEffects) {
          const audio = new Audio("/notification-sound.mp3");
          audio.play().catch(error => {
            console.error("Error playing notification sound:", error);
          });
        }
        
        showNotificationToast(
          "Task Reminder", 
          `It's time for: ${task.title}`
        );
        
        console.log("Task notification successfully triggered");
      } catch (error) {
        console.error("Error triggering task notification:", error);
        showErrorToast(
          "Notification Error", 
          "Could not trigger task notification"
        );
      }
    } else {
      console.warn("Cannot trigger notification - permission not granted or notifications disabled");
    }
  }, [settings.notifications, settings.soundEffects]);

  useEffect(() => {
    console.log("Task notification scheduler effect triggered. Tasks count:", upcomingTasks.length);
    
    Object.values(taskNotificationTimeoutsIds).forEach(id => {
      clearTimeout(id);
    });
    
    setTaskNotificationTimeoutsIds({});
    
    if (!settings.notifications || notificationPermission !== "granted" || !upcomingTasks.length) {
      console.log("Conditions not met for scheduling task notifications, skipping");
      return;
    }
    
    const newTimeoutIds: Record<string, number> = {};
    const now = new Date().getTime();
    
    console.log(`Current time for task scheduling: ${new Date().toLocaleString()}`);
    
    upcomingTasks.forEach(task => {
      if (!task.time) {
        console.log(`Task ${task.id} has no time set, skipping`);
        return;
      }
      
      const taskTime = new Date(task.time).getTime();
      
      const delay = taskTime - now;
      const minutesToGo = Math.round(delay / (60 * 1000));
      
      console.log(`Scheduling task: "${task.title}", Time: ${new Date(taskTime).toLocaleString()}, Delay: ${delay}ms (${minutesToGo} minutes)`);
      
      if (delay > 0) {
        console.log(`✅ Scheduling notification for task "${task.title}" in ${minutesToGo} minutes`);
        
        const id = window.setTimeout(() => {
          console.log(`⏰ TIME TO EXECUTE notification for task "${task.title}"`);
          triggerTaskNotification(task);
        }, delay) as unknown as number;
        
        newTimeoutIds[task.id] = id;
      } else if (delay > -60000) { // If the task is less than 1 minute overdue, notify anyway
        console.log(`⚠️ Task "${task.title}" time is very recent (${Math.abs(minutesToGo)} minutes ago), triggering notification`);
        triggerTaskNotification(task);
      } else {
        console.log(`⚠️ Task "${task.title}" time has already passed (${Math.abs(minutesToGo)} minutes ago), skipping notification`);
      }
    });
    
    console.log(`Successfully scheduled ${Object.keys(newTimeoutIds).length} task notifications`);
    setTaskNotificationTimeoutsIds(newTimeoutIds);
    
    return () => {
      Object.values(newTimeoutIds).forEach(id => {
        clearTimeout(id);
      });
    };
  }, [settings.notifications, notificationPermission, upcomingTasks, triggerTaskNotification]);

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
      console.log(`Daily reminder scheduled for: ${formattedTime} (in ${Math.round(delay/1000/60)} minutes)`);
      
      const id = window.setTimeout(() => {
        console.log("⏰ EXECUTING DAILY REMINDER NOTIFICATION NOW!");
        triggerNotification();
        scheduleReminderNotification();
      }, delay);
      
      setTimeoutId(id);
    }
  };

  const triggerNotification = () => {
    if (Notification.permission === "granted" && settings.notifications) {
      try {
        console.log("Sending daily reminder notification...");
        const notification = new Notification("Timewise Daily Reminder", {
          body: "It's time to check your tasks and habits for today!",
          icon: "/favicon.ico",
          tag: `daily-reminder-${Date.now()}`
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        if (settings.soundEffects) {
          const audio = new Audio("/notification-sound.mp3");
          audio.play().catch(error => {
            console.error("Error playing notification sound:", error);
          });
        }
        
        showNotificationToast(
          "Daily Reminder", 
          "It's time to check your tasks and habits for today!"
        );
        
        console.log("Daily reminder notification successfully sent");
      } catch (error) {
        console.error("Error triggering daily reminder notification:", error);
      }
    } else {
      console.warn("Cannot trigger daily reminder - permission not granted or notifications disabled");
    }
  };

  const handleNotificationChange = async (checked: boolean) => {
    if (checked) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === "granted") {
          updateSetting('notifications', true);
          showSuccessToast(
            "Notifications Enabled", 
            "You will now receive notifications from the app."
          );
          
          queryClient.invalidateQueries({ queryKey: ["upcoming-tasks"] });
          
          if (settings.dailyReminderTime) {
            scheduleReminderNotification();
          }
        } else {
          showErrorToast(
            "Notifications Blocked", 
            "Please enable notifications in your browser settings to use this feature."
          );
          updateSetting('notifications', false);
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        showErrorToast(
          "Error", 
          "There was an error requesting notification permission."
        );
      }
    } else {
      updateSetting('notifications', false);
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === "granted") {
          updateSetting('notifications', true);
          showSuccessToast(
            "Notifications Enabled", 
            "You will now receive notifications from the app."
          );
          
          queryClient.invalidateQueries({ queryKey: ["upcoming-tasks"] });
          
          if (settings.dailyReminderTime) {
            scheduleReminderNotification();
          }
        } else {
          showErrorToast(
            "Notification Permission Denied", 
            "Please enable notifications in your browser settings to use this feature."
          );
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        showErrorToast(
          "Error", 
          "There was an error requesting notification permission."
        );
      }
    }
  };

  const triggerTestNotification = () => {
    if (Notification.permission === "granted" && settings.notifications) {
      try {
        console.log("Sending test notification...");
        window.setTimeout(() => {
          const notification = new Notification("Test Notification", {
            body: "This is a test notification from Timewise",
            icon: "/favicon.ico",
            tag: `test-notification-${Date.now()}`
          });
          
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
          
          if (settings.soundEffects) {
            const audio = new Audio("/notification-sound.mp3");
            audio.play().catch(error => {
              console.error("Error playing notification sound:", error);
            });
          }
          
          showSuccessToast(
            "Test Notification Sent", 
            "If you didn't see a notification, check your browser settings."
          );
          
          console.log("Test notification successfully sent");
        }, 0);
      } catch (error) {
        console.error("Error sending test notification:", error);
        showErrorToast(
          "Notification Error", 
          "Could not send test notification: " + (error instanceof Error ? error.message : String(error))
        );
      }
    } else {
      showErrorToast(
        "Notification Error", 
        "Notifications are not enabled or permission was denied"
      );
    }
  };
  
  const manuallyCheckOverdueTasks = () => {
    console.log("Manually checking for overdue tasks...");
    if (!settings.notifications || notificationPermission !== "granted" || !upcomingTasks.length) {
      console.log("Cannot check overdue tasks - notifications disabled or no tasks");
      showSuccessToast(
        "No tasks available", 
        "No upcoming tasks found or notifications are disabled."
      );
      return;
    }
    
    const now = new Date();
    let notifiedCount = 0;
    
    upcomingTasks.forEach(task => {
      if (!task.time) return;
      
      const taskTime = new Date(task.time);
      const timeDiff = now.getTime() - taskTime.getTime();
      
      if (timeDiff >= -5 * 60 * 1000 && timeDiff <= 5 * 60 * 1000) {
        console.log(`Found task due now or very soon: "${task.title}" (${Math.round(timeDiff/1000/60)} minutes ago)`);
        triggerTaskNotification(task);
        notifiedCount++;
      }
    });
    
    console.log(`Manual check complete. Notified about ${notifiedCount} tasks.`);
    
    if (notifiedCount === 0) {
      showSuccessToast(
        "No tasks due now", 
        "There are no tasks due at this moment."
      );
    }
  };

  return {
    notificationSupported,
    notificationPermission,
    handleNotificationChange,
    requestNotificationPermission,
    triggerTestNotification,
    manuallyCheckOverdueTasks,
  };
};
