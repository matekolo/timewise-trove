
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Tile from "@/components/ui/Tile";
import { generateCategoryData } from "@/utils/reportUtils";
import { Task } from "@/hooks/useReportsData";

interface CategoryChartProps {
  filteredTasks: Task[];
  delay?: number;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

const CategoryChart: React.FC<CategoryChartProps> = ({ filteredTasks, delay = 2 }) => {
  const categoryData = generateCategoryData(filteredTasks);

  return (
    <Tile title="Task Categories" delay={delay}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData.length > 0 ? categoryData : [{ name: "No data", value: 1 }]}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "white",
                border: "1px solid #f0f0f0",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Tile>
  );
};

export default CategoryChart;
