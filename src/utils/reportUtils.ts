
import { format } from 'date-fns';

/**
 * Converts an object to CSV format
 * @param data Array of objects to convert
 * @returns CSV string
 */
export const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create header row
  const headerRow = headers.join(',');
  
  // Create rows from data
  const rows = data.map(obj => {
    return headers.map(header => {
      // Handle commas in the content by wrapping in quotes
      const value = obj[header];
      const valueString = value === null || value === undefined ? '' : String(value);
      return `"${valueString.replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Creates and downloads a productivity report as CSV
 * @param reportData Report data to download
 */
export const downloadReportAsCSV = (reportData: any) => {
  // Convert summary data to array for CSV
  const summaryData = [{
    Date: format(new Date(), 'yyyy-MM-dd'),
    TimeRange: reportData.timeRange,
    ProductivityScore: `${reportData.productivityScore}%`,
    CompletedTasks: reportData.completedTasks,
    TotalTasks: reportData.totalTasks,
    CompletionRate: reportData.totalTasks > 0 
      ? `${Math.round((reportData.completedTasks / reportData.totalTasks) * 100)}%` 
      : '0%'
  }];
  
  // Convert category data
  const categoryData = reportData.categories.map((cat: any) => ({
    Category: cat.name,
    TaskCount: cat.value
  }));
  
  // Convert habit data
  const habitData = reportData.topHabits.map((habit: any) => ({
    HabitName: habit.name,
    Streak: habit.streak,
    Type: habit.type
  }));
  
  // Create separate CSV sections
  const summaryCSV = convertToCSV(summaryData);
  const categoryCSV = convertToCSV(categoryData);
  const habitCSV = convertToCSV(habitData);
  
  // Combine all sections
  const fullReport = 
    `PRODUCTIVITY REPORT - ${format(new Date(), 'yyyy-MM-dd')}\n\n` +
    `SUMMARY\n${summaryCSV}\n\n` +
    `TASK CATEGORIES\n${categoryCSV}\n\n` +
    `TOP HABITS\n${habitCSV}`;
  
  // Create a blob and download link
  const blob = new Blob([fullReport], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `productivity-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
