
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  eventDates?: Date[];
  eventColors?: Record<string, string>;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  eventDates = [],
  eventColors = {},
  ...props
}: CalendarProps) {
  // Create a mapping of dates to determine which days have events
  const eventDateMap = React.useMemo(() => {
    const map = new Map<string, string[]>();
    
    eventDates.forEach((date, index) => {
      const dateString = date.toISOString().split('T')[0];
      const existingTypes = map.get(dateString) || [];
      
      // Get event type safely (default to 'default' if not found)
      let eventType = 'default';
      const modifiersObject = props.modifiers as Record<string, unknown> || {};
      if (modifiersObject && typeof modifiersObject === 'object' && 'eventTypes' in modifiersObject) {
        const eventTypes = modifiersObject.eventTypes as any[];
        if (Array.isArray(eventTypes) && eventTypes[index]) {
          eventType = eventTypes[index];
        }
      }
      
      map.set(dateString, [...existingTypes, eventType]);
    });
    
    return map;
  }, [eventDates, props.modifiers]);

  // Custom day rendering to add event indicators
  const renderDay = (day: Date, dayModifiers: Record<string, boolean> = {}) => {
    const dateString = day.toISOString().split('T')[0];
    const hasEvent = eventDateMap.has(dateString);
    const eventTypes = eventDateMap.get(dateString) || [];
    
    return (
      <div className="relative w-full h-full flex items-center justify-center pointer-events-auto cursor-pointer">
        <div 
          className={cn(
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
            hasEvent && !dayModifiers.outside ? "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary" : ""
          )}
        >
          {day.getDate()}
        </div>
        {hasEvent && !dayModifiers.outside && eventTypes.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {eventTypes.map((type, i) => (
              <div 
                key={`${type}-${i}`}
                className={cn(
                  "h-1 w-1 rounded-full",
                  eventColors[type] || "bg-primary"
                )}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative cursor-pointer pointer-events-auto [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 cursor-pointer pointer-events-auto"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4 pointer-events-none" {...props} />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4 pointer-events-none" {...props} />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
