
import React from "react";
import Tile from "@/components/ui/Tile";
import { calculateProductivityScore, getTopHabits } from "@/utils/reportUtils";
import { Task, Habit } from "@/hooks/useReportsData";

interface SummaryTileProps {
  filteredTasks: Task[];
  habits: Habit[];
  delay?: number;
}

const SummaryTile: React.FC<SummaryTileProps> = ({ 
  filteredTasks, 
  habits, 
  delay = 3 
}) => {
  const { completedTasksCount, totalTasksCount, productivityScore } = 
    calculateProductivityScore(filteredTasks);
  
  const topHabits = getTopHabits(habits);

  return (
    <Tile title="Summary" className="md:col-span-2" delay={delay}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 bg-green-50 rounded-md text-center">
            <p className="text-green-600 font-medium text-sm">Productivity Score</p>
            <h3 className="text-2xl font-bold text-green-700 mt-1">{productivityScore}%</h3>
            <p className="text-xs text-green-600 mt-1">Based on {totalTasksCount} tasks</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-md text-center">
            <p className="text-blue-600 font-medium text-sm">Completed Tasks</p>
            <h3 className="text-2xl font-bold text-blue-700 mt-1">{completedTasksCount}</h3>
            <p className="text-xs text-blue-600 mt-1">
              {totalTasksCount > 0 
                ? `${Math.round((completedTasksCount / totalTasksCount) * 100)}% completion rate` 
                : 'No tasks yet'}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Top Habits</h4>
          <div className="space-y-2">
            {topHabits.length > 0 ? (
              topHabits.map(habit => (
                <div key={habit.id} className="flex items-center justify-between">
                  <span className="text-sm">{habit.name}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="bg-green-500 w-2 h-2 rounded-full"></span>
                    {habit.streak} days streak
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No habits tracked yet</p>
            )}
          </div>
        </div>
      </div>
    </Tile>
  );
};

export default SummaryTile;
