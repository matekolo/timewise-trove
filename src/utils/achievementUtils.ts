
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
    default:
      break;
  }
  
  // Trigger storage event to make sure other components update
  window.dispatchEvent(new Event('settings-updated'));
};

export const calculateAchievementProgress = (
  taskCompletedCount: number,
  highPriorityCompleted: number,
  longestStreak: number,
  notesCount: number,
  badHabitsWithStreak: number
): Achievement[] => {
  return [
    {
      id: "early-bird",
      name: "Early Bird",
      description: "Complete 5 tasks before 9 AM",
      criteria: "Complete tasks early in the morning",
      reward: "Morning Theme",
      icon: "sun",
      progressCount: taskCompletedCount,
      progress: Math.min(taskCompletedCount / 5 * 100, 100),
      unlocked: taskCompletedCount >= 5
    },
    {
      id: "focus-master",
      name: "Focus Master",
      description: "Complete 10 high priority tasks",
      criteria: "Complete high priority tasks",
      reward: "Productivity Avatar",
      icon: "target",
      progressCount: highPriorityCompleted,
      progress: Math.min(highPriorityCompleted / 10 * 100, 100),
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
      progress: Math.min(taskCompletedCount / 25 * 100, 100),
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
      progress: Math.min(longestStreak / 7 * 100, 100),
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
      progress: Math.min(notesCount / 5 * 100, 100),
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
      progress: Math.min(badHabitsWithStreak / 3 * 100, 100),
      unlocked: badHabitsWithStreak >= 3
    },
    {
      id: "consistency-king",
      name: "Consistency King",
      description: "Complete tasks for 14 consecutive days",
      criteria: "Complete at least one task every day for 14 days",
      reward: "Royal Crown Avatar",
      icon: "crown",
      progressCount: 0, // This would need more complex tracking
      progress: 30, // Placeholder
      unlocked: false
    },
    {
      id: "night-owl",
      name: "Night Owl",
      description: "Complete 10 tasks after 8 PM",
      criteria: "Complete tasks in the evening",
      reward: "Dark Theme",
      icon: "moon",
      progressCount: 0, // This would need time-based tracking
      progress: 70, // Placeholder
      unlocked: false
    }
  ];
};
