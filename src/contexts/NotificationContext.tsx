
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { toast, notificationExists } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NotificationContextType {
  triggerTaskNotification: (task: any) => void;
  scheduleTaskNotifications: () => void;
  scheduleReminderNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useUserSettings();
  const timeoutIdRef = useRef<number | null>(null);
  const taskNotificationTimeoutsIdsRef = useRef<Record<string, number>>({});
  const initializedRef = useRef(false);
  const mountedRef = useRef(false);
  
  const { data: upcomingTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ["upcoming-tasks"],
    queryFn: async () => {
      if (!settings.notifications || Notification.permission !== "granted") return [];
      
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
    enabled: settings.notifications && Notification.permission === "granted",
    refetchInterval: 60000, // Check for new tasks every minute
  });

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      
      Object.values(taskNotificationTimeoutsIdsRef.current).forEach(id => {
        clearTimeout(id);
      });
    };
  }, []);

  useEffect(() => {
    if (!initializedRef.current && mountedRef.current && settings.notifications && 
        settings.dailyReminderTime && Notification.permission === "granted") {
      scheduleReminderNotification();
      initializedRef.current = true;
    }
    
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [settings.notifications, settings.dailyReminderTime]);

  useEffect(() => {
    if (mountedRef.current && settings.notifications && 
        Notification.permission === "granted" && upcomingTasks.length > 0) {
      scheduleTaskNotifications();
    }
    
    return () => {
      Object.values(taskNotificationTimeoutsIdsRef.current).forEach(id => {
        clearTimeout(id);
      });
    };
  }, [settings.notifications, upcomingTasks]);

  const scheduleReminderNotification = () => {
    if (settings.notifications && settings.dailyReminderTime && Notification.permission === "granted") {
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
      
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      
      const id = window.setTimeout(() => {
        triggerDailyReminder();
        scheduleReminderNotification();
      }, delay);
      
      timeoutIdRef.current = id;
    }
  };

  const triggerDailyReminder = () => {
    console.log("Triggering daily reminder notification");
    if (Notification.permission === "granted" && settings.notifications) {
      if (!notificationExists("Timewise Daily Reminder", "It's time to check your tasks and habits for today!")) {
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
    }
  };

  const scheduleTaskNotifications = () => {
    // Clear existing timeouts
    Object.values(taskNotificationTimeoutsIdsRef.current).forEach(id => {
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
    
    taskNotificationTimeoutsIdsRef.current = newTimeoutIds;
  };

  const triggerTaskNotification = (task: any) => {
    console.log("Triggering task notification for:", task.title);
    if (Notification.permission === "granted" && settings.notifications) {
      try {
        // Use the notificationExists function to check if already displayed
        if (notificationExists("Task Reminder", `It's time for: ${task.title}`)) {
          console.log("Notification already active for task:", task.title);
          return;
        }
        
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
          duration: 6000,
        });
      } catch (err) {
        console.error("Error triggering task notification:", err);
      }
    }
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        triggerTaskNotification, 
        scheduleTaskNotifications,
        scheduleReminderNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
