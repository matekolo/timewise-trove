
import { Achievement } from "@/types/achievementTypes";

export const applyRewardEffect = (achievement: Achievement) => {
  const currentSettings = localStorage.getItem('user-settings') ? 
    JSON.parse(localStorage.getItem('user-settings') || '{}') : 
    {};
  
  switch (achievement.id) {
    case "early-bird":
      localStorage.setItem('user-settings', JSON.stringify({
        ...currentSettings,
        themeColor: 'morning'
      }));
      break;
    case "night-owl":
      localStorage.setItem('user-settings', JSON.stringify({
        ...currentSettings,
        themeColor: 'night',
        darkMode: true
      }));
      break;
    case "zen-mind":
      localStorage.setItem('user-settings', JSON.stringify({
        ...currentSettings,
        avatar: 'zen'
      }));
      break;
    case "focus-master":
      localStorage.setItem('user-settings', JSON.stringify({
        ...currentSettings,
        avatar: 'productivity'
      }));
      break;
    case "streak-master":
      localStorage.setItem('user-settings', JSON.stringify({
        ...currentSettings,
        themeColor: 'gold'
      }));
      break;
    default:
      break;
  }
  
  // Trigger storage event to make sure other components update
  window.dispatchEvent(new Event('settings-updated'));
};

export const calculateAchievementProgress = (
  taskCompletedCount: number,
  earlyBirdTasksCount: number,
  highPriorityCompleted: number,
  longestStreak: number,
  notesCount: number,
  badHabitsWithStreak: number,
  eveningTasksCount: number = 0,
  dailyStreak: number = 0
): Achievement[] => {
  return [
    {
      id: "early-bird",
      name: "Early Bird",
      description: "Complete 5 tasks before 9 AM",
      criteria: "Complete tasks early in the morning",
      reward: "Morning Theme",
      icon: "sun",
      progressCount: earlyBirdTasksCount,
      progress: earlyBirdTasksCount >= 5 ? 100 : (earlyBirdTasksCount / 5 * 100),
      unlocked: earlyBirdTasksCount >= 5
    },
    {
      id: "focus-master",
      name: "Focus Master",
      description: "Complete 10 high priority tasks",
      criteria: "Complete high priority tasks",
      reward: "Productivity Avatar",
      icon: "target",
      progressCount: highPriorityCompleted,
      progress: highPriorityCompleted >= 10 ? 100 : (highPriorityCompleted / 10 * 100),
      unlocked: highPriorityCompleted >= 10
    },
    {
      id: "task-champion",
      name: "Task Champion",
      description: "Complete 25 tasks total",
      criteria: "Complete a total of 25 tasks",
      reward: "Champion Badge",
      icon: "award",
      progressCount: taskCompletedCount,
      progress: taskCompletedCount >= 25 ? 100 : (taskCompletedCount / 25 * 100),
      unlocked: taskCompletedCount >= 25
    },
    {
      id: "streak-master",
      name: "Streak Master",
      description: "Maintain a 7-day streak on any habit",
      criteria: "Maintain a habit streak for 7 days",
      reward: "Gold Theme",
      icon: "flame",
      progressCount: longestStreak,
      progress: longestStreak >= 7 ? 100 : (longestStreak / 7 * 100),
      unlocked: longestStreak >= 7
    },
    {
      id: "zen-mind",
      name: "Zen Mind",
      description: "Create 5 notes",
      criteria: "Create at least 5 notes",
      reward: "Zen Avatar",
      icon: "feather",
      progressCount: notesCount,
      progress: notesCount >= 5 ? 100 : (notesCount / 5 * 100),
      unlocked: notesCount >= 5
    },
    {
      id: "habit-breaker",
      name: "Habit Breaker",
      description: "Successfully break 3 bad habits",
      criteria: "Mark 3 habits as 'bad' and maintain streak",
      reward: "Custom Theme Colors",
      icon: "scissors",
      progressCount: badHabitsWithStreak,
      progress: badHabitsWithStreak >= 3 ? 100 : (badHabitsWithStreak / 3 * 100),
      unlocked: badHabitsWithStreak >= 3
    },
    {
      id: "consistency-king",
      name: "Consistency King",
      description: "Complete tasks for 14 consecutive days",
      criteria: "Complete at least one task every day for 14 days",
      reward: "Royal Crown Avatar",
      icon: "crown",
      progressCount: dailyStreak,
      progress: dailyStreak >= 14 ? 100 : (dailyStreak / 14 * 100), 
      unlocked: dailyStreak >= 14
    },
    {
      id: "night-owl",
      name: "Night Owl",
      description: "Complete 10 tasks after 8 PM",
      criteria: "Complete tasks in the evening",
      reward: "Dark Theme",
      icon: "moon",
      progressCount: eveningTasksCount,
      progress: eveningTasksCount >= 10 ? 100 : (eveningTasksCount / 10 * 100),
      unlocked: eveningTasksCount >= 10
    }
  ];
};
