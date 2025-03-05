
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
    case "task-champion":
      localStorage.setItem('user-settings', JSON.stringify({
        ...currentSettings,
        showChampionBadge: true
      }));
      break;
    default:
      break;
  }
  
  // Trigger storage event to make sure other components update
  window.dispatchEvent(new Event('settings-updated'));
};

// This function triggers achievement updates when a task is completed or modified
export const triggerTaskAchievementUpdate = () => {
  window.dispatchEvent(new CustomEvent('task-updated'));
};

// This function triggers achievement updates when a habit streak is updated
export const triggerHabitAchievementUpdate = () => {
  window.dispatchEvent(new CustomEvent('habit-updated'));
};

// This function triggers achievement updates when a note is created
export const triggerNoteAchievementUpdate = () => {
  window.dispatchEvent(new CustomEvent('note-created'));
};

// This is a specific function just for streak updates to ensure they're properly tracked
export const triggerStreakAchievementUpdate = () => {
  window.dispatchEvent(new CustomEvent('streak-updated'));
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
  const createAchievement = (
    id: string,
    name: string,
    description: string,
    criteria: string,
    reward: string,
    icon: string,
    progressCount: number,
    target: number
  ): Achievement => {
    const unlocked = progressCount >= target;
    const progress = unlocked ? 100 : (progressCount / target * 100);
    
    return {
      id,
      name,
      description,
      criteria,
      reward,
      icon,
      progressCount,
      progress,
      unlocked
    };
  };

  return [
    createAchievement(
      "early-bird",
      "Early Bird",
      "Complete 5 tasks before 9 AM",
      "Complete tasks early in the morning",
      "Morning Theme",
      "sun",
      earlyBirdTasksCount,
      5
    ),
    createAchievement(
      "focus-master",
      "Focus Master", 
      "Complete 10 high priority tasks",
      "Complete high priority tasks",
      "Productivity Avatar",
      "target",
      highPriorityCompleted,
      10
    ),
    createAchievement(
      "task-champion",
      "Task Champion",
      "Complete 25 tasks total",
      "Complete a total of 25 tasks",
      "Champion Badge",
      "award",
      taskCompletedCount,
      25
    ),
    createAchievement(
      "streak-master",
      "Streak Master",
      "Maintain a 7-day streak on any habit",
      "Maintain a habit streak for 7 days",
      "Gold Theme",
      "flame",
      longestStreak,
      7
    ),
    createAchievement(
      "zen-mind",
      "Zen Mind",
      "Create 5 notes",
      "Create at least 5 notes",
      "Zen Avatar",
      "feather",
      notesCount,
      5
    ),
    createAchievement(
      "habit-breaker",
      "Habit Breaker",
      "Successfully break 3 bad habits",
      "Mark 3 habits as 'bad' and maintain streak",
      "Custom Theme Colors",
      "scissors",
      badHabitsWithStreak,
      3
    ),
    createAchievement(
      "consistency-king",
      "Consistency King",
      "Complete tasks for 14 consecutive days",
      "Complete at least one task every day for 14 days",
      "Royal Crown Avatar",
      "crown",
      dailyStreak,
      14
    ),
    createAchievement(
      "night-owl",
      "Night Owl",
      "Complete 10 tasks after 8 PM",
      "Complete tasks in the evening",
      "Dark Theme",
      "moon",
      eveningTasksCount,
      10
    )
  ];
};
