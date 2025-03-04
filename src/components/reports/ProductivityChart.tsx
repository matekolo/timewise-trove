
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Tile from "@/components/ui/Tile";
import { generateProductivityData } from "@/utils/reportUtils";
import { Task } from "@/hooks/useReportsData";

interface ProductivityChartProps {
  filteredTasks: Task[];
  delay?: number;
}

const ProductivityChart: React.FC<ProductivityChartProps> = ({ filteredTasks, delay = 0 }) => {
  const productivityData = generateProductivityData(filteredTasks);

  return (
    <Tile title="Productivity Score" delay={delay}>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={productivityData}
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
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={3}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Tile>
  );
};

export default ProductivityChart;
