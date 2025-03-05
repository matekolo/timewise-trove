import { Achievement } from "@/types/achievementTypes";
import { toast } from "@/components/ui/use-toast";

export const calculateAchievementProgress = (
  taskCompletedCount: number,
  earlyBirdTasksCount: number,
  highPriorityCompleted: number,
  longestStreak: number,
  notesCount: number,
  badHabitsWithStreak: number,
  eveningTasksCount: number,
  dailyStreak: number
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

export const applyRewardEffect = (achievement: Achievement) => {
  const savedSettings = localStorage.getItem('user-settings');
  let settings = savedSettings ? JSON.parse(savedSettings) : {};
  
  switch (achievement.id) {
    case "early-bird":
      settings.themeColor = "morning";
      break;
    case "night-owl":
      settings.themeColor = "night";
      settings.darkMode = true;
      break;
    case "zen-mind":
      settings.avatar = "zen";
      break;
    case "focus-master":
      settings.avatar = "productivity";
      break;
    case "streak-master":
      settings.themeColor = "gold";
      break;
    case "task-champion":
      settings.showChampionBadge = true;
      break;
    case "habit-breaker":
      settings.customThemeColors = true;
      break;
    case "consistency-king":
      settings.avatar = "crown";
      break;
  }
  
  localStorage.setItem('user-settings', JSON.stringify(settings));
  
  if (achievement.id === "night-owl") {
    document.documentElement.classList.add('dark');
  }
  
  if (["morning", "night", "gold"].includes(achievement.id)) {
    document.documentElement.setAttribute('data-theme', settings.themeColor);
  }
  
  window.dispatchEvent(new Event('settings-updated'));
};

export const triggerTaskAchievementUpdate = () => {
  console.log("Triggering task achievement update");
  window.dispatchEvent(new CustomEvent('task-updated'));
};

export const triggerHabitAchievementUpdate = () => {
  console.log("Triggering habit achievement update");
  window.dispatchEvent(new CustomEvent('habit-updated'));
};

export const triggerNoteAchievementUpdate = () => {
  console.log("Triggering note achievement update");
  window.dispatchEvent(new CustomEvent('note-created'));
};

export const triggerStreakAchievementUpdate = () => {
  console.log("Triggering streak achievement update");
  window.dispatchEvent(new CustomEvent('streak-updated'));
};
