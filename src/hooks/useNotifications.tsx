
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { UserSettings } from "@/hooks/useUserSettings";

export const useNotifications = (settings: UserSettings, updateSetting: (key: keyof UserSettings, value: any) => void) => {
  const queryClient = useQueryClient();
  const [notificationSupported, setNotificationSupported] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);
  const [taskNotificationTimeoutsIds, setTaskNotificationTimeoutsIds] = useState<Record<string, number>>({});

  // Fetch upcoming tasks for notifications
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
        .not("time", "is", null);
      
      if (error) {
        console.error("Error fetching upcoming tasks:", error);
        return [];
      }
      
      console.log(`Fetched ${data?.length || 0} tasks for notifications`);
      return data || [];
    },
    enabled: settings.notifications && notificationPermission === "granted",
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Initialize notification system
  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationSupported(false);
      toast({
        title: "Notifications Not Supported",
        description: "Your browser does not support notifications",
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
  }, [settings.notifications, updateSetting]);

  // Schedule daily reminder
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

  // Schedule task notifications
  useEffect(() => {
    console.log("Task notification effect triggered. Tasks count:", upcomingTasks.length);
    
    // Clear existing timeouts
    Object.values(taskNotificationTimeoutsIds).forEach(id => {
      clearTimeout(id);
    });
    
    if (!settings.notifications || notificationPermission !== "granted" || upcomingTasks.length === 0) {
      console.log("Conditions not met for scheduling task notifications, skipping");
      return;
    }
    
    const newTimeoutIds: Record<string, number> = {};
    
    // Debug info
    console.log("Current time:", new Date().toISOString());
    
    upcomingTasks.forEach(task => {
      if (!task.time) {
        console.log(`Task ${task.id} has no time set, skipping`);
        return;
      }
      
      // Parse the task time correctly
      const taskTime = new Date(task.time);
      const now = new Date();
      const delay = taskTime.getTime() - now.getTime();
      
      console.log(`Task: ${task.title}, Time: ${taskTime.toLocaleString()}, Delay: ${delay}ms`);
      
      // Only schedule if task is in the future but within 24 hours
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        console.log(`Scheduling notification for task "${task.title}" in ${Math.round(delay/1000/60)} minutes`);
        
        // Force a new number to avoid TypeScript timer ID issues
        const id = window.setTimeout(() => {
          console.log(`Executing notification for task "${task.title}"`);
          triggerTaskNotification(task);
        }, delay) as unknown as number;
        
        newTimeoutIds[task.id] = id;
      } else if (delay <= 0) {
        // If task time has passed but is within last 2 minutes, notify immediately
        const twoMinutesAgo = now.getTime() - 2 * 60 * 1000;
        if (taskTime.getTime() > twoMinutesAgo) {
          console.log(`Task "${task.title}" is due now or very recently, triggering immediate notification`);
          triggerTaskNotification(task);
        } else {
          console.log(`Task "${task.title}" time has already passed, skipping notification`);
        }
      } else {
        console.log(`Task "${task.title}" is more than 24 hours in the future, skipping for now`);
      }
    });
    
    setTaskNotificationTimeoutsIds(newTimeoutIds);
    console.log("Scheduled notifications count:", Object.keys(newTimeoutIds).length);
    
    return () => {
      Object.values(newTimeoutIds).forEach(id => {
        clearTimeout(id);
      });
    };
  }, [settings.notifications, notificationPermission, upcomingTasks, settings.soundEffects]);

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
    if (Notification.permission === "granted" && settings.notifications) {
      const notification = new Notification("Timewise Daily Reminder", {
        body: "It's time to check your tasks and habits for today!",
        icon: "/favicon.ico"
      });
      
      if (settings.soundEffects) {
        const audio = new Audio("/notification-sound.mp3");
        audio.play().catch(error => {
          console.error("Error playing notification sound:", error);
        });
      }
      
      toast({
        title: "Daily Reminder",
        description: "It's time to check your tasks and habits for today!",
      });
    }
  };

  const triggerTaskNotification = (task: any) => {
    console.log(`Triggering notification for task: ${task.title}`);
    
    if (Notification.permission === "granted" && settings.notifications) {
      try {
        // Create browser notification
        const notification = new Notification("Task Reminder", {
          body: `It's time for: ${task.title}`,
          icon: "/favicon.ico",
          tag: `task-${task.id}-${Date.now()}` // Unique tag to prevent stacking but allow multiple notifications for same task
        });
        
        // Add onclick handler for the notification
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        // Play sound if enabled
        if (settings.soundEffects) {
          const audio = new Audio("/notification-sound.mp3");
          audio.play().catch(error => {
            console.error("Error playing notification sound:", error);
          });
        }
        
        // Also show in-app toast
        toast({
          title: "Task Reminder",
          description: `It's time for: ${task.title}`,
        });
        
        console.log("Task notification successfully triggered");
      } catch (error) {
        console.error("Error triggering task notification:", error);
        toast({
          title: "Notification Error",
          description: "Could not trigger task notification",
          variant: "destructive",
        });
      }
    } else {
      console.warn("Cannot trigger notification - permission not granted or notifications disabled");
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
            title: "Notifications Enabled",
            description: "You will now receive notifications from the app.",
          });
          
          // Refresh task notifications immediately
          queryClient.invalidateQueries({ queryKey: ["upcoming-tasks"] });
          
          if (settings.dailyReminderTime) {
            scheduleReminderNotification();
          }
        } else {
          toast({
            title: "Notifications Blocked",
            description: "Please enable notifications in your browser settings to use this feature.",
            variant: "destructive",
          });
          updateSetting('notifications', false);
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        toast({
          title: "Error",
          description: "There was an error requesting notification permission.",
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
          
          // Refresh task notifications immediately
          queryClient.invalidateQueries({ queryKey: ["upcoming-tasks"] });
          
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

  const triggerTestNotification = () => {
    if (Notification.permission === "granted" && settings.notifications) {
      try {
        const notification = new Notification("Test Notification", {
          body: "This is a test notification from Timewise",
          icon: "/favicon.ico"
        });
        
        if (settings.soundEffects) {
          const audio = new Audio("/notification-sound.mp3");
          audio.play().catch(error => {
            console.error("Error playing notification sound:", error);
          });
        }
        
        toast({
          title: "Test Notification Sent",
          description: "If you didn't see a notification, check your browser settings.",
        });
      } catch (error) {
        console.error("Error sending test notification:", error);
        toast({
          title: "Notification Error",
          description: "Could not send test notification: " + (error instanceof Error ? error.message : String(error)),
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Notification Error",
        description: "Notifications are not enabled or permission was denied",
        variant: "destructive",
      });
    }
  };

  return {
    notificationSupported,
    notificationPermission,
    handleNotificationChange,
    requestNotificationPermission,
    triggerTestNotification,
  };
};
