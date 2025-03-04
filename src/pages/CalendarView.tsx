import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, PieChart, MapPin, Clock } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DayPicker, Matcher } from "react-day-picker";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string; // ISO string in database
  time: string | null;
  type: "meeting" | "personal" | "deadline" | "other";
  user_id: string;
}

// Define a type for the day modifiers that matches react-day-picker's expectations
type CalendarModifiers = Record<string, Date[]>;

const eventTypes = {
  meeting: { label: "Meeting", color: "bg-blue-100 text-blue-800", indicator: "bg-blue-500" },
  personal: { label: "Personal", color: "bg-green-100 text-green-800", indicator: "bg-green-500" },
  deadline: { label: "Deadline", color: "bg-red-100 text-red-800", indicator: "bg-red-500" },
  other: { label: "Other", color: "bg-purple-100 text-purple-800", indicator: "bg-purple-500" },
};

const CalendarView = () => {
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Omit<Event, "id" | "user_id">>({
    title: "",
    description: "",
    date: new Date().toISOString(),
    time: "",
    type: "meeting",
  });
  const [viewMode, setViewMode] = useState<"month" | "day">("month");
  
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*");
      
      if (error) {
        toast({
          title: "Error fetching events",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Event[];
    },
  });
  
  const addEventMutation = useMutation({
    mutationFn: async (event: Omit<Event, "id">) => {
      const { data, error } = await supabase
        .from("events")
        .insert(event)
        .select()
        .single();
      
      if (error) {
        toast({
          title: "Error adding event",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event added",
        description: `${newEvent.title} has been added to your calendar.`,
      });
      
      setNewEvent({
        title: "",
        description: "",
        date: new Date().toISOString(),
        time: "",
        type: "meeting",
      });
      setIsDialogOpen(false);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
      
      if (error) {
        toast({
          title: "Error deleting event",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event deleted",
        description: "The event has been deleted from your calendar.",
      });
    },
  });
  
  const addEvent = async () => {
    if (newEvent.title.trim() === "") {
      toast({
        title: "Please enter an event title",
        variant: "destructive",
      });
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to add events",
        variant: "destructive",
      });
      return;
    }
    
    addEventMutation.mutate({
      ...newEvent,
      user_id: user.id,
    });
  };

  const eventDates = useMemo(() => {
    return events.map(event => parseISO(event.date));
  }, [events]);

  const eventColors = useMemo(() => {
    return Object.entries(eventTypes).reduce((acc, [key, value]) => {
      acc[key] = value.indicator;
      return acc;
    }, {} as Record<string, string>);
  }, []);

  const calendarModifiers = useMemo(() => {
    const modifiers: CalendarModifiers = {};
    
    Object.keys(eventTypes).forEach(type => {
      modifiers[type] = events
        .filter(event => event.type === type)
        .map(event => parseISO(event.date));
    });
    
    return modifiers;
  }, [events]);

  const selectedDateEvents = useMemo(() => {
    return events
      .filter(event => {
        const eventDate = parseISO(event.date);
        return isSameDay(eventDate, selectedDate);
      })
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
  }, [events, selectedDate]);

  const currentMonthEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameMonth(eventDate, date);
    });
  }, [events, date]);

  const eventCountsByType = useMemo(() => {
    return currentMonthEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [currentMonthEvents]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return currentMonthEvents
      .filter(event => {
        const eventDate = parseISO(event.date);
        return eventDate >= now;
      })
      .sort((a, b) => {
        return parseISO(a.date).getTime() - parseISO(b.date).getTime();
      })
      .slice(0, 3);
  }, [currentMonthEvents]);

  const goToPreviousMonth = () => {
    setDate(prev => subMonths(prev, 1));
  };
  
  const goToNextMonth = () => {
    setDate(prev => addMonths(prev, 1));
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Visualize and organize your schedule</p>
        </motion.div>
        
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "day")} className="mr-2">
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Event</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add a new event</DialogTitle>
                <DialogDescription>
                  Create a new event for your calendar
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="details">Event Details</TabsTrigger>
                  <TabsTrigger value="date">Date & Time</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-title">Event title</Label>
                    <Input
                      id="event-title"
                      placeholder="E.g., Team meeting"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="event-description">Description (optional)</Label>
                    <Textarea
                      id="event-description"
                      placeholder="Add details about this event"
                      value={newEvent.description || ""}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="h-20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Event type</Label>
                    <Select
                      value={newEvent.type}
                      onValueChange={(value: "meeting" | "personal" | "deadline" | "other") => 
                        setNewEvent({ ...newEvent, type: value })
                      }
                    >
                      <SelectTrigger id="event-type">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="date" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Calendar
                      mode="single"
                      selected={parseISO(newEvent.date)}
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          setNewEvent({ ...newEvent, date: selectedDate.toISOString() });
                        }
                      }}
                      className="rounded-md border mx-auto"
                    />
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="event-time">Time</Label>
                    <Input
                      id="event-time"
                      type="time"
                      value={newEvent.time || ""}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addEvent}>Add Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tile contentClassName="p-0 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">
                {date && format(date, "MMMM yyyy")}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={date.toString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(newDate) => newDate && setSelectedDate(newDate)}
                  month={date}
                  onMonthChange={setDate}
                  className="w-full"
                  eventDates={eventDates}
                  eventColors={eventColors}
                  modifiers={calendarModifiers}
                />
              </motion.div>
            </AnimatePresence>
          </Tile>

          {viewMode === "day" && (
            <Tile title={format(selectedDate, "EEEE, MMMM d, yyyy")} className="mt-6">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading events...</p>
                  </div>
                ) : selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-3 rounded-md border border-border"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{event.title}</h4>
                        <Badge variant="outline" className={`${eventTypes[event.type].color}`}>
                          {eventTypes[event.type].label}
                        </Badge>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      )}
                      
                      <div className="flex justify-between items-center mt-2">
                        {event.time && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {event.time}
                          </div>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteEventMutation.mutate(event.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No events for this day</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                      Add event
                    </Button>
                  </div>
                )}
              </div>
            </Tile>
          )}
        </div>
        
        <div className="space-y-6">
          <Tile title="Monthly Overview">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <PieChart className="h-4 w-4 mr-1" />
                  Events by Type
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(eventTypes).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-md border">
                      <span className="text-sm">{value.label}</span>
                      <Badge variant="outline" className={value.color}>
                        {eventCountsByType[key] || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Upcoming Events
                </h4>
                
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingEvents.map((event) => (
                      <div 
                        key={event.id} 
                        className="p-2 rounded-md border flex justify-between cursor-pointer hover:bg-accent/50"
                        onClick={() => setSelectedDate(parseISO(event.date))}
                      >
                        <div>
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(event.date), "MMM d")}
                            {event.time && `, ${event.time}`}
                          </p>
                        </div>
                        <div className={`w-2 h-full rounded-full ${eventTypes[event.type].indicator}`} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming events this month</p>
                )}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New Event
              </Button>
            </div>
          </Tile>
          
          <Tile title="Legend">
            <div className="space-y-1">
              {Object.entries(eventTypes).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${value.indicator}`} />
                  <span className="text-sm">{value.label}</span>
                </div>
              ))}
            </div>
          </Tile>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
