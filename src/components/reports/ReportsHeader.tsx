
import React from "react";
import { motion } from "framer-motion";
import { Calendar, Download } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { toast } from "@/components/ui/use-toast";
import { TimeRange } from "@/hooks/useReportsData";

interface ReportsHeaderProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  timeRange: TimeRange;
  setTimeRange: (value: TimeRange) => void;
}

const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  date,
  setDate,
  timeRange,
  setTimeRange
}) => {
  const downloadReport = () => {
    toast({
      title: "Report downloaded",
      description: "Your productivity report has been downloaded.",
    });
  };

  return (
    <div className="flex justify-between items-center">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Track your progress and productivity</p>
      </motion.div>
      
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{date ? format(date, "MMM d, yyyy") : "Select date"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarUI
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={downloadReport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
};

export default ReportsHeader;
