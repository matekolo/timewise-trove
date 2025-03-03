
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, MoreHorizontal, Trash2, Edit } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";

interface Habit {
  id: number;
  name: string;
  goal: string;
  streak: number;
  days: boolean[];
}

const HabitTracker = () => {
  const [habits, setHabits] = useState<Habit[]>([
    {
      id: 1,
      name: "No smoking",
      goal: "Quit smoking completely",
      streak: 5,
      days: [true, true, true, true, true, false, false],
    },
    {
      id: 2,
      name: "Daily meditation",
      goal: "Meditate for 10 minutes daily",
      streak: 3,
      days: [true, true, true, false, false, false, false],
    },
  ]);
  
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitGoal, setNewHabitGoal] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const addHabit = () => {
    if (newHabitName.trim() === "") {
      toast({
        title: "Please enter a habit name",
        variant: "destructive",
      });
      return;
    }
    
    const newHabit: Habit = {
      id: Date.now(),
      name: newHabitName,
      goal: newHabitGoal,
      streak: 0,
      days: Array(7).fill(false),
    };
    
    setHabits([...habits, newHabit]);
    setNewHabitName("");
    setNewHabitGoal("");
    setIsDialogOpen(false);
    
    toast({
      title: "Habit added",
      description: `${newHabitName} has been added to your habits.`,
    });
  };
  
  const toggleDay = (habitId: number, dayIndex: number) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === habitId) {
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
          
          return {
            ...habit,
            days: newDays,
            streak,
          };
        }
        return habit;
      })
    );
  };
  
  const deleteHabit = (habitId: number) => {
    setHabits(habits.filter((habit) => habit.id !== habitId));
    toast({
      title: "Habit deleted",
      description: "The habit has been deleted.",
    });
  };
  
  const getDayName = (index: number) => {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index];
  };

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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Habit</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new habit</DialogTitle>
              <DialogDescription>
                Create a new habit to track your progress
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addHabit}>Add Habit</Button>
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
                      <DropdownMenuItem className="cursor-pointer">
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
                      onClick={() => toggleDay(habit.id, dayIndex)}
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
