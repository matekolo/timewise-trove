
import { format, parseISO } from "date-fns";
import { Task, Habit } from "@/hooks/useReportsData";

export const generateProductivityData = (filteredTasks: Task[]) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  return days.map(day => {
    const dayTasks = filteredTasks.filter(task => {
      const taskDate = parseISO(task.created_at);
      return format(taskDate, 'EEE') === day;
    });
    
    if (dayTasks.length === 0) return { name: day, value: 0 };
    
    const completedCount = dayTasks.filter(task => task.completed).length;
    const percentage = Math.round((completedCount / dayTasks.length) * 100);
    
    return {
      name: day,
      value: percentage
    };
  });
};

export const generateCategoryData = (filteredTasks: Task[]) => {
  const categories: Record<string, number> = {};
  
  filteredTasks.forEach(task => {
    const category = task.category || 'uncategorized';
    if (categories[category]) {
      categories[category]++;
    } else {
      categories[category] = 1;
    }
  });
  
  return Object.entries(categories).map(([name, value]) => ({ 
    name, 
    value 
  }));
};

export const generateHabitData = (habits: Habit[]) => {
  return habits
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .slice(0, 7)
    .map(habit => ({
      name: habit.name.length > 10 ? habit.name.slice(0, 10) + '...' : habit.name,
      value: habit.streak || 0
    }));
};

export const calculateProductivityScore = (filteredTasks: Task[]) => {
  const completedTasksCount = filteredTasks.filter(task => task.completed).length;
  const totalTasksCount = filteredTasks.length;
  
  return {
    completedTasksCount,
    totalTasksCount,
    productivityScore: totalTasksCount > 0 
      ? Math.round((completedTasksCount / totalTasksCount) * 100) 
      : 0
  };
};

export const getTopHabits = (habits: Habit[], count: number = 2) => {
  return habits
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .slice(0, count);
};
