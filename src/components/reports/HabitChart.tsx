
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Tile from "@/components/ui/Tile";
import { generateHabitData } from "@/utils/reportUtils";
import { Habit } from "@/hooks/useReportsData";

interface HabitChartProps {
  habits: Habit[];
  delay?: number;
}

const HabitChart: React.FC<HabitChartProps> = ({ habits, delay = 1 }) => {
  const habitData = generateHabitData(habits);

  return (
    <Tile title="Habit Tracking" delay={delay}>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={habitData}
            margin={{
              top: 20,
              right: 20,
              left: -10,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "white",
                border: "1px solid #f0f0f0",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}
            />
            <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Tile>
  );
};

export default HabitChart;
