
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useReportsData } from "@/hooks/useReportsData";
import ReportsHeader from "@/components/reports/ReportsHeader";
import ProductivityChart from "@/components/reports/ProductivityChart";
import HabitChart from "@/components/reports/HabitChart";
import CategoryChart from "@/components/reports/CategoryChart";
import SummaryTile from "@/components/reports/SummaryTile";

const Reports = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();
  
  const {
    habits,
    filteredTasks,
    timeRange,
    setTimeRange
  } = useReportsData();

  return (
    <div className="space-y-6">
      <ReportsHeader 
        date={date}
        setDate={setDate}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProductivityChart filteredTasks={filteredTasks} delay={0} />
        <HabitChart habits={habits} delay={1} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CategoryChart filteredTasks={filteredTasks} delay={2} />
        <SummaryTile 
          filteredTasks={filteredTasks}
          habits={habits}
          delay={3}
        />
      </div>
      
      <div className="flex justify-center mt-4">
        <Button 
          onClick={() => navigate("/achievements")} 
          variant="outline"
          className="flex items-center gap-2"
        >
          View Achievements
        </Button>
      </div>
    </div>
  );
};

export default Reports;
