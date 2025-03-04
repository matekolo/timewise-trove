
import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast"; // Correct import from hooks/use-toast
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
      
      // Get current time minus 5 minutes to also fetch very recent tasks
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      // Get tomorrow's date for the upper limit
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("completed", false)
        .not("time", "is", null)
        .gte("time", fiveMinutesAgo.toISOString()) // Get tasks from 5 minutes ago
        .lt("time", tomorrow.toISOString()); // Up to tomorrow
      
      if (error) {
        console.error("Error fetching upcoming tasks:", error);
        return [];
      }
      
      console.log(`Fetched ${data?.length || 0} tasks for notifications, time range: ${fiveMinutesAgo.toISOString()} to ${tomorrow.toISOString()}`);
      
      // Log each task's time for debugging
      if (data && data.length > 0) {
        data.forEach(task => {
          const taskTime = new Date(task.time);
          const minutesToGo = Math.round((taskTime.getTime() - now.getTime()) / (60 * 1000));
          console.log(`Task "${task.title}" is due ${minutesToGo > 0 ? `in ${minutesToGo} minutes` : 'now or in the past'} (${taskTime.toLocaleString()})`);
        });
      }
      
      return data || [];
    },
    enabled: settings.notifications && notificationPermission === "granted",
    refetchInterval: 30000, // Refetch every 30 seconds to ensure we don't miss tasks
    staleTime: 15000, // Consider data stale after 15 seconds
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

  // Create a separate direct task notification function - this is important
  const triggerTaskNotification = useCallback((task: any) => {
    console.log(`Triggering notification for task: ${task.title}`);
    
    if (Notification.permission === "granted" && settings.notifications) {
      try {
        // Create browser notification with unique tag
        const uniqueTag = `task-${task.id}-${Date.now()}`;
        console.log(`Creating notification with tag: ${uniqueTag}`);
        
        const notification = new Notification("Task Reminder", {
          body: `It's time for: ${task.title}`,
          icon: "/favicon.ico",
          tag: uniqueTag
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
        
        // Also show in-app toast - Use direct toast from hooks/use-toast
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
  }, [settings.notifications, settings.soundEffects]);

  // COMPLETELY REWRITTEN: Task notification scheduling - using the same reliable approach as dailyReminder
  useEffect(() => {
    console.log("Task notification scheduler effect triggered. Tasks count:", upcomingTasks.length);
    
    // Clear all existing task notification timeouts
    Object.values(taskNotificationTimeoutsIds).forEach(id => {
      clearTimeout(id);
    });
    setTaskNotificationTimeoutsIds({});
    
    if (!settings.notifications || notificationPermission !== "granted" || !upcomingTasks.length) {
      console.log("Conditions not met for scheduling task notifications, skipping");
      return;
    }
    
    const newTimeoutIds: Record<string, number> = {};
    const now = new Date();
    
    console.log(`Current time for task scheduling: ${now.toLocaleString()}`);
    
    // IMPORTANT: Process each task and schedule its notification
    upcomingTasks.forEach(task => {
      if (!task.time) {
        console.log(`Task ${task.id} has no time set, skipping`);
        return;
      }
      
      // Parse the task time correctly
      const taskTime = new Date(task.time);
      
      // Calculate the delay in milliseconds
      const delay = taskTime.getTime() - now.getTime();
      const minutesToGo = Math.round(delay / (60 * 1000));
      
      console.log(`Scheduling task: "${task.title}", Time: ${taskTime.toLocaleString()}, Delay: ${delay}ms (${minutesToGo} minutes)`);
      
      // For immediate notification if task is due very soon (within 2 minutes)
      if (delay >= -2 * 60 * 1000 && delay <= 2 * 60 * 1000) {
        console.log(`Task "${task.title}" is due now or very soon, triggering immediate notification`);
        // Use setTimeout with a tiny delay to avoid flooding with notifications
        const id = window.setTimeout(() => {
          triggerTaskNotification(task);
        }, 100) as unknown as number;
        newTimeoutIds[`immediate-${task.id}`] = id;
        return;
      }
      
      // Only schedule future tasks (that are more than 2 minutes in the future)
      if (delay > 2 * 60 * 1000 && delay < 24 * 60 * 60 * 1000) {
        console.log(`Scheduling future notification for task "${task.title}" in ${minutesToGo} minutes`);
        
        // Use direct setTimeout API (same approach used by daily reminders)
        const id = window.setTimeout(() => {
          console.log(`⏰ TIME TO EXECUTE notification for task "${task.title}"`);
          triggerTaskNotification(task);
        }, delay) as unknown as number;
        
        newTimeoutIds[task.id] = id;
      } else if (delay <= -2 * 60 * 1000) {
        console.log(`Task "${task.title}" time has already passed by more than 2 minutes (${Math.abs(minutesToGo)} minutes ago), skipping notification`);
      } else {
        console.log(`Task "${task.title}" is more than 24 hours in the future (${minutesToGo} minutes), skipping for now`);
      }
    });
    
    console.log(`Successfully scheduled ${Object.keys(newTimeoutIds).length} task notifications`);
    setTaskNotificationTimeoutsIds(newTimeoutIds);
    
    return () => {
      // Clean up all timeouts when component unmounts or when dependencies change
      Object.values(newTimeoutIds).forEach(id => {
        clearTimeout(id);
      });
    };
  }, [settings.notifications, notificationPermission, upcomingTasks, settings.soundEffects, triggerTaskNotification]);

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
        
        // Use the directly imported toast function
        toast({
          title: "Daily Reminder",
          description: "It's time to check your tasks and habits for today!",
        });
        
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
        console.log("Sending test notification...");
        // Use window.setTimeout to ensure this runs outside React's timing
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
          
          // Direct toast call
          toast({
            title: "Test Notification Sent",
            description: "If you didn't see a notification, check your browser settings.",
          });
          
          console.log("Test notification successfully sent");
        }, 0);
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
  
  const manuallyCheckOverdueTasks = () => {
    console.log("Manually checking for overdue tasks...");
    if (!settings.notifications || notificationPermission !== "granted" || !upcomingTasks.length) {
      console.log("Cannot check overdue tasks - notifications disabled or no tasks");
      return;
    }
    
    const now = new Date();
    let notifiedCount = 0;
    
    upcomingTasks.forEach(task => {
      if (!task.time) return;
      
      const taskTime = new Date(task.time);
      const timeDiff = now.getTime() - taskTime.getTime();
      
      // Notify about any tasks due within the last 5 minutes or about to be due in 5 minutes
      if (timeDiff >= -5 * 60 * 1000 && timeDiff <= 5 * 60 * 1000) {
        console.log(`Found task due now or very soon: "${task.title}" (${Math.round(timeDiff/1000/60)} minutes ago)`);
        triggerTaskNotification(task);
        notifiedCount++;
      }
    });
    
    console.log(`Manual check complete. Notified about ${notifiedCount} tasks.`);
    
    if (notifiedCount === 0) {
      toast({
        title: "No tasks due now",
        description: "There are no tasks due at this moment.",
      });
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
