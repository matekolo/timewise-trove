
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date;
  time: string;
  type: "meeting" | "personal" | "deadline" | "other";
}

const eventTypes = {
  meeting: { label: "Meeting", color: "bg-blue-100 text-blue-800" },
  personal: { label: "Personal", color: "bg-green-100 text-green-800" },
  deadline: { label: "Deadline", color: "bg-red-100 text-red-800" },
  other: { label: "Other", color: "bg-purple-100 text-purple-800" },
};

const CalendarView = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      title: "Team meeting",
      description: "Weekly team sync",
      date: new Date(2023, 4, 15),
      time: "10:00",
      type: "meeting",
    },
    {
      id: 2,
      title: "Project deadline",
      description: "Submit final deliverables",
      date: new Date(2023, 4, 22),
      time: "18:00",
      type: "deadline",
    },
    {
      id: 3,
      title: "Dentist appointment",
      description: "Regular checkup",
      date: new Date(2023, 4, 18),
      time: "14:30",
      type: "personal",
    },
  ]);
  
  const [newEvent, setNewEvent] = useState<Omit<Event, "id">>({
    title: "",
    description: "",
    date: new Date(),
    time: "",
    type: "meeting",
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const addEvent = () => {
    if (newEvent.title.trim() === "") {
      toast({
        title: "Please enter an event title",
        variant: "destructive",
      });
      return;
    }
    
    const event: Event = {
      id: Date.now(),
      ...newEvent,
    };
    
    setEvents([...events, event]);
    setNewEvent({
      title: "",
      description: "",
      date: new Date(),
      time: "",
      type: "meeting",
    });
    setIsDialogOpen(false);
    
    toast({
      title: "Event added",
      description: `${newEvent.title} has been added to your calendar.`,
    });
  };
  
  const selectedDateEvents = events.filter(
    (event) =>
      date &&
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
  );
  
  const previousMonth = () => {
    if (date) {
      const prevMonth = new Date(date);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      setDate(prevMonth);
    }
  };
  
  const nextMonth = () => {
    if (date) {
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setDate(nextMonth);
    }
  };
  
  const formatDate = (date: Date) => {
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
          <p className="text-muted-foreground">Manage your schedule and events</p>
        </motion.div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Event</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new event</DialogTitle>
              <DialogDescription>
                Create a new event for your calendar
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
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
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <Calendar
                  mode="single"
                  selected={newEvent.date}
                  onSelect={(date) => date && setNewEvent({ ...newEvent, date })}
                  className="rounded-md border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="event-time">Time</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
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
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addEvent}>Add Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tile contentClassName="p-0">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">
                {date && new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="w-full"
            />
          </Tile>
        </div>
        
        <div>
          <Tile title={date ? formatDate(date) : "Select a date"}>
            <div className="space-y-4">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents
                  .sort((a, b) => {
                    if (!a.time) return 1;
                    if (!b.time) return -1;
                    return a.time.localeCompare(b.time);
                  })
                  .map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-3 rounded-md border border-border"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{event.title}</h4>
                        <div className={`text-xs px-2 py-0.5 rounded-full ${eventTypes[event.type].color}`}>
                          {eventTypes[event.type].label}
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      )}
                      
                      {event.time && (
                        <div className="mt-2 text-xs text-gray-500">
                          {event.time}
                        </div>
                      )}
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
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
