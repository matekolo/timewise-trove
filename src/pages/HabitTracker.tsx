
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, X, MoreHorizontal, Trash2, Edit, ThumbsUp, ThumbsDown, Check, Calendar } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { triggerHabitAchievementUpdate, triggerStreakAchievementUpdate } from "@/utils/achievementUtils";

interface Habit {
  id: string;
  name: string;
  goal: string;
  streak: number;
  days: boolean[];
  type: "good" | "bad";
  user_id: string;
  created_at?: string;
  updated_at?: string;
  history?: Record<string, boolean>;
}

const HabitTracker = () => {
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitGoal, setNewHabitGoal] = useState("");
  const [newHabitType, setNewHabitType] = useState<"good" | "bad">("good");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "good" | "bad">("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "calendar">("week");
  const queryClient = useQueryClient();
  
  const fetchHabits = async (): Promise<Habit[]> => {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching habits:", error);
      throw error;
    }
    
    return (data || []).map(habit => ({
      ...habit,
      type: habit.type || "good",
      history: habit.history || {},
      days: habit.days || [false, false, false, false, false, false, false]
    })) as Habit[];
  };
  
  const { data: habits = [], isLoading, error } = useQuery({
    queryKey: ["habits"],
    queryFn: fetchHabits,
  });
  
  const addHabitMutation = useMutation({
    mutationFn: async (habit: Omit<Habit, "id">) => {
      const { data, error } = await supabase
        .from("habits")
        .insert(habit)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setNewHabitName("");
      setNewHabitGoal("");
      setNewHabitType("good");
      setIsDialogOpen(false);
      
      toast({
        title: "Habit added",
        description: `${newHabitName} has been added to your habits.`,
      });
    },
    onError: (error) => {
      console.error("Error adding habit:", error);
      toast({
        title: "Error adding habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateHabitMutation = useMutation({
    mutationFn: async (habit: Partial<Habit> & { id: string }) => {
      const { data, error } = await supabase
        .from("habits")
        .update(habit)
        .eq("id", habit.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
    onError: (error) => {
      console.error("Error updating habit:", error);
      toast({
        title: "Error updating habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", habitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast({
        title: "Habit deleted",
        description: "The habit has been deleted.",
      });
    },
    onError: (error) => {
      console.error("Error deleting habit:", error);
      toast({
        title: "Error deleting habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const addHabit = async () => {
    if (newHabitName.trim() === "") {
      toast({
        title: "Please enter a habit name",
        variant: "destructive",
      });
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to add habits",
        variant: "destructive",
      });
      return;
    }
    
    if (editingHabit) {
      updateHabitMutation.mutate({
        id: editingHabit.id,
        name: newHabitName,
        goal: newHabitGoal,
        type: newHabitType,
      });
      setEditingHabit(null);
    } else {
      addHabitMutation.mutate({
        name: newHabitName,
        goal: newHabitGoal,
        streak: 0,
        days: [false, false, false, false, false, false, false],
        history: {},
        type: newHabitType,
        user_id: user.id
      });
    }
  };
  
  const getCurrentWeekDates = () => {
    const today = startOfDay(new Date());
    const dates = [];
    
    for (let i = 6; i >= 0; i--) {
      dates.push(subDays(today, i));
    }
    
    return dates;
  };
  
  const weekDates = getCurrentWeekDates();
  
  const toggleDateInHistory = (habit: Habit, date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const newHistory = { ...(habit.history || {}) };
    
    newHistory[formattedDate] = !newHistory[formattedDate];
    
    let streak = calculateStreak(newHistory, habit.type);
    
    updateHabitMutation.mutate({
      id: habit.id,
      history: newHistory,
      streak,
    }, {
      onSuccess: () => {
        // Trigger both events separately to ensure they're properly handled
        triggerHabitAchievementUpdate();
        
        // Explicitly trigger streak update for the Streak Master achievement
        setTimeout(() => {
          triggerStreakAchievementUpdate();
          console.log("Streak achievement update triggered:", streak);
        }, 100);
      }
    });
  };
  
  const calculateStreak = (history: Record<string, boolean>, habitType: "good" | "bad" = "good") => {
    if (!history) return 0;
    
    const sortedDates = Object.entries(history)
      .filter(([_, completed]) => completed)
      .map(([date]) => date)
      .sort((a, b) => (parseISO(b) > parseISO(a) ? 1 : -1));
    
    if (sortedDates.length === 0) return 0;
    
    let streak = 1;
    let currentDate = parseISO(sortedDates[0]);
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = subDays(currentDate, 1);
      const checkDate = parseISO(sortedDates[i]);
      
      if (format(prevDate, 'yyyy-MM-dd') === format(checkDate, 'yyyy-MM-dd')) {
        streak++;
        currentDate = checkDate;
      } else {
        break;
      }
    }
    
    return streak;
  };
  
  const deleteHabit = (habitId: string) => {
    deleteHabitMutation.mutate(habitId);
  };
  
  const editHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabitName(habit.name);
    setNewHabitGoal(habit.goal || "");
    setNewHabitType(habit.type || "good");
    setIsDialogOpen(true);
  };
  
  const getDayName = (index: number) => {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index];
  };
  
  const isDateCompleted = (habit: Habit, date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return habit.history && habit.history[formattedDate];
  };
  
  const getCalendarDates = () => {
    const dates = [];
    const today = startOfDay(new Date());
    
    for (let i = 30; i >= -7; i--) {
      dates.push(subDays(today, i));
    }
    
    return dates;
  };
  
  const calendarDates = getCalendarDates();
  
  const filteredHabits = habits.filter((habit: any) => {
    const habitType = habit.type || "good";
    if (activeFilter === "all") return true;
    return habitType === activeFilter;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-600">Error loading habits</h3>
        <p className="text-muted-foreground mt-1">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold">Habit Tracker</h1>
          <p className="text-muted-foreground">Track and build better habits</p>
        </motion.div>
        
        <div className="flex gap-2 items-center">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setViewMode(viewMode === "week" ? "calendar" : "week")}
            aria-label="Switch view"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingHabit(null);
              setNewHabitName("");
              setNewHabitGoal("");
              setNewHabitType("good");
            }
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Habit</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingHabit ? "Edit habit" : "Add a new habit"}</DialogTitle>
                <DialogDescription>
                  {editingHabit ? "Update your habit details" : "Create a new habit to track your progress"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="habit-name">Habit name</Label>
                  <Input
                    id="habit-name"
                    placeholder="E.g., Daily exercise"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="habit-goal">Goal (optional)</Label>
                  <Input
                    id="habit-goal"
                    placeholder="E.g., 30 minutes of exercise daily"
                    value={newHabitGoal}
                    onChange={(e) => setNewHabitGoal(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Habit Type</Label>
                  <RadioGroup 
                    value={newHabitType} 
                    onValueChange={(value: "good" | "bad") => setNewHabitType(value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="good" id="habit-type-good" />
                      <Label htmlFor="habit-type-good" className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                        <span>Good Habit</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bad" id="habit-type-bad" />
                      <Label htmlFor="habit-type-bad" className="flex items-center gap-1">
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                        <span>Bad Habit</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground mt-1">
                    {newHabitType === "good" 
                      ? "A habit you want to build and maintain" 
                      : "A habit you want to break or avoid"}
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingHabit(null);
                    setNewHabitName("");
                    setNewHabitGoal("");
                    setNewHabitType("good");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={addHabit}
                  disabled={addHabitMutation.isPending || updateHabitMutation.isPending}
                >
                  {editingHabit ? "Update Habit" : "Add Habit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant={activeFilter === "all" ? "default" : "outline"} 
          size="sm"
          onClick={() => setActiveFilter("all")}
        >
          All Habits
        </Button>
        <Button 
          variant={activeFilter === "good" ? "default" : "outline"} 
          size="sm"
          className="gap-1"
          onClick={() => setActiveFilter("good")}
        >
          <ThumbsUp className="h-3 w-3" />
          <span>Good Habits</span>
        </Button>
        <Button 
          variant={activeFilter === "bad" ? "default" : "outline"} 
          size="sm"
          className="gap-1"
          onClick={() => setActiveFilter("bad")}
        >
          <ThumbsDown className="h-3 w-3" />
          <span>Bad Habits</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {filteredHabits.map((habit: Habit, index) => (
          <Tile
            key={habit.id}
            delay={index}
            className="overflow-visible"
          >
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      {habit.name}
                      <Badge variant={habit.type === "bad" ? "destructive" : "default"} className="ml-2">
                        {habit.type === "bad" ? "Avoid Habit" : "Build Habit"}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">{habit.goal}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`text-sm px-3 py-1 rounded-full ${
                    habit.type === "bad" 
                      ? "bg-red-100 text-red-700" 
                      : "bg-primary/10 text-primary"
                  } font-medium`}>
                    {habit.streak} day {habit.type === "bad" ? "avoiding" : "streak"}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => editHabit(habit)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => deleteHabit(habit.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {viewMode === "week" && (
                <div className="grid grid-cols-7 gap-2 mt-4">
                  {weekDates.map((date, dayIndex) => (
                    <div key={dayIndex} className="flex flex-col items-center">
                      <span className="text-xs text-muted-foreground mb-2">
                        {format(date, 'EEE')}
                      </span>
                      <span className="text-xs text-muted-foreground mb-1">
                        {format(date, 'MM/dd')}
                      </span>
                      <button
                        className={`w-10 h-10 rounded-full border transition-all duration-200 flex items-center justify-center ${
                          isDateCompleted(habit, date)
                            ? habit.type === "bad"
                              ? "bg-red-500 border-red-500 text-white"
                              : "bg-primary border-primary text-white"
                            : "border-gray-200 text-gray-400 hover:border-primary/50"
                        }`}
                        onClick={() => toggleDateInHistory(habit, date)}
                        aria-label={habit.type === "bad" ? "Mark as avoided" : "Mark as completed"}
                      >
                        {isDateCompleted(habit, date) ? (
                          habit.type === "bad" ? (
                            <X className="h-5 w-5" />
                          ) : (
                            <Check className="h-5 w-5" />
                          )
                        ) : (
                          <Plus className="h-5 w-5" />
                        )}
                      </button>
                      {isDateCompleted(habit, date) && (
                        <span className="text-xs mt-1 font-medium text-center">
                          {habit.type === "bad" ? "Avoided" : "Completed"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {viewMode === "calendar" && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-3">30-Day History</h4>
                  <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-12 lg:grid-cols-14 gap-2">
                    {calendarDates.map((date, index) => (
                      <Popover key={index}>
                        <PopoverTrigger asChild>
                          <button
                            className={`w-8 h-8 rounded border transition-all duration-200 flex items-center justify-center text-xs ${
                              isDateCompleted(habit, date)
                                ? habit.type === "bad"
                                  ? "bg-red-500 border-red-500 text-white"
                                  : "bg-primary border-primary text-white"
                                : format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                  ? "border-primary/50 bg-primary/5" 
                                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                            onClick={() => toggleDateInHistory(habit, date)}
                          >
                            {format(date, 'dd')}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="center">
                          <div className="text-center">
                            <p className="font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</p>
                            <p className="text-sm mt-1">
                              {isDateCompleted(habit, date) 
                                ? habit.type === "good" 
                                  ? "Completed ✓" 
                                  : "Avoided ✕" 
                                : "Not tracked"}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Tile>
        ))}
        
        {filteredHabits.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No habits found</h3>
            <p className="text-muted-foreground mt-1">
              {activeFilter === "all" 
                ? "Add your first habit to start tracking" 
                : `No ${activeFilter} habits found. Add one using the button above.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitTracker;
