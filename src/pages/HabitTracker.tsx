
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, X, MoreHorizontal, Trash2, Edit } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Habit {
  id: string;
  name: string;
  goal: string;
  streak: number;
  days: boolean[];
  user_id: string;
}

const HabitTracker = () => {
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitGoal, setNewHabitGoal] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const queryClient = useQueryClient();
  
  // Fetch habits from Supabase
  const fetchHabits = async (): Promise<Habit[]> => {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching habits:", error);
      throw error;
    }
    
    return data || [];
  };
  
  const { data: habits = [], isLoading, error } = useQuery({
    queryKey: ["habits"],
    queryFn: fetchHabits,
  });
  
  // Add a new habit
  const addHabitMutation = useMutation({
    mutationFn: async (habit: Omit<Habit, "id" | "user_id">) => {
      const { data, error } = await supabase
        .from("habits")
        .insert([habit])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setNewHabitName("");
      setNewHabitGoal("");
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
  
  // Update a habit
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
  
  // Delete a habit
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
  
  const addHabit = () => {
    if (newHabitName.trim() === "") {
      toast({
        title: "Please enter a habit name",
        variant: "destructive",
      });
      return;
    }
    
    if (editingHabit) {
      // Update existing habit
      updateHabitMutation.mutate({
        id: editingHabit.id,
        name: newHabitName,
        goal: newHabitGoal,
      });
      setEditingHabit(null);
    } else {
      // Add new habit
      addHabitMutation.mutate({
        name: newHabitName,
        goal: newHabitGoal,
        streak: 0,
        days: [false, false, false, false, false, false, false],
      });
    }
  };
  
  const toggleDay = (habit: Habit, dayIndex: number) => {
    const newDays = [...habit.days];
    newDays[dayIndex] = !newDays[dayIndex];
    
    // Calculate streak
    let streak = 0;
    for (let i = 0; i < newDays.length; i++) {
      if (newDays[i]) {
        streak++;
      } else {
        break;
      }
    }
    
    updateHabitMutation.mutate({
      id: habit.id,
      days: newDays,
      streak,
    });
  };
  
  const deleteHabit = (habitId: string) => {
    deleteHabitMutation.mutate(habitId);
  };
  
  const editHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabitName(habit.name);
    setNewHabitGoal(habit.goal || "");
    setIsDialogOpen(true);
  };
  
  const getDayName = (index: number) => {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index];
  };

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
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingHabit(null);
            setNewHabitName("");
            setNewHabitGoal("");
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
                  placeholder="E.g., No smoking"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="habit-goal">Goal (optional)</Label>
                <Input
                  id="habit-goal"
                  placeholder="E.g., Quit smoking completely"
                  value={newHabitGoal}
                  onChange={(e) => setNewHabitGoal(e.target.value)}
                />
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
      
      <div className="grid grid-cols-1 gap-6">
        {habits.map((habit, index) => (
          <Tile
            key={habit.id}
            delay={index}
            className="overflow-visible"
          >
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{habit.name}</h3>
                  <p className="text-sm text-muted-foreground">{habit.goal}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 text-primary font-medium text-sm px-3 py-1 rounded-full">
                    {habit.streak} day streak
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
              
              <div className="grid grid-cols-7 gap-2 mt-4">
                {habit.days.map((completed, dayIndex) => (
                  <div key={dayIndex} className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground mb-2">
                      {getDayName(dayIndex)}
                    </span>
                    <button
                      className={`w-10 h-10 rounded-full border transition-all duration-200 flex items-center justify-center ${
                        completed
                          ? "bg-primary border-primary text-white"
                          : "border-gray-200 text-gray-400 hover:border-primary/50"
                      }`}
                      onClick={() => toggleDay(habit, dayIndex)}
                    >
                      {completed ? (
                        <X className="h-5 w-5" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Tile>
        ))}
        
        {habits.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No habits added yet</h3>
            <p className="text-muted-foreground mt-1">Add your first habit to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitTracker;
