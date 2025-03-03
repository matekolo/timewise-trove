
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, Calendar, Trash2, Check, CalendarClock } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Task {
  id: string;
  title: string;
  description: string | null;
  time: string | null;
  priority: "low" | "medium" | "high";
  completed: boolean;
  user_id: string;
}

const Planner = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Omit<Task, "id" | "user_id" | "completed">>({
    title: "",
    description: "",
    time: "",
    priority: "medium",
  });
  
  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("time", { ascending: true });
      
      if (error) {
        toast({
          title: "Error fetching tasks",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Task[];
    },
  });
  
  // Add a new task
  const addTaskMutation = useMutation({
    mutationFn: async (task: Omit<Task, "id" | "completed">) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();
      
      if (error) {
        toast({
          title: "Error adding task",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["achievement-tasks"] });
      toast({
        title: "Task added",
        description: `${newTask.title} has been added to your planner.`,
      });
      
      setNewTask({
        title: "",
        description: "",
        time: "",
        priority: "medium",
      });
      setIsDialogOpen(false);
    },
  });
  
  // Toggle task completion
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({ completed })
        .eq("id", taskId)
        .select()
        .single();
      
      if (error) {
        toast({
          title: "Error updating task",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["achievement-tasks"] });
    },
  });
  
  // Delete task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);
      
      if (error) {
        toast({
          title: "Error deleting task",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["achievement-tasks"] });
      toast({
        title: "Task deleted",
        description: "The task has been deleted from your planner.",
      });
    },
  });
  
  const addTask = async () => {
    if (newTask.title.trim() === "") {
      toast({
        title: "Please enter a task title",
        variant: "destructive",
      });
      return;
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to add tasks",
        variant: "destructive",
      });
      return;
    }
    
    addTaskMutation.mutate({
      ...newTask,
      user_id: user.id,
    });
  };
  
  const toggleComplete = (taskId: string, currentState: boolean) => {
    toggleCompleteMutation.mutate({ 
      taskId, 
      completed: !currentState 
    });
  };
  
  const deleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };
  
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold">Daily Planner</h1>
          <p className="text-muted-foreground">Plan and organize your day</p>
        </motion.div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new task</DialogTitle>
              <DialogDescription>
                Add a task to your daily planner
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task title</Label>
                <Input
                  id="task-title"
                  placeholder="E.g., Team meeting"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="task-description">Description (optional)</Label>
                <Textarea
                  id="task-description"
                  placeholder="Add details about this task"
                  value={newTask.description || ""}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="task-time">Time</Label>
                <Input
                  id="task-time"
                  type="time"
                  value={newTask.time || ""}
                  onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: "low" | "medium" | "high") => 
                    setNewTask({ ...newTask, priority: value })
                  }
                >
                  <SelectTrigger id="task-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addTask}>Add Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Tile
          title="Today's Schedule"
          contentClassName="p-0"
        >
          <div className="divide-y">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading tasks...</p>
              </div>
            ) : tasks.length > 0 ? (
              tasks
                .sort((a, b) => {
                  if (!a.time) return 1;
                  if (!b.time) return -1;
                  return a.time.localeCompare(b.time);
                })
                .map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-4 flex items-start gap-4 transition-colors ${
                      task.completed ? "bg-gray-50" : ""
                    }`}
                  >
                    <button
                      onClick={() => toggleComplete(task.id, task.completed)}
                      className={`w-5 h-5 rounded-full border flex-shrink-0 mt-1 ${
                        task.completed
                          ? "bg-primary border-primary text-white flex items-center justify-center"
                          : "border-gray-300"
                      }`}
                    >
                      {task.completed && <Check className="h-3 w-3" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </h3>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-gray-400 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm mt-1 ${task.completed ? "line-through text-muted-foreground" : "text-gray-600"}`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex mt-2 gap-2">
                        {task.time && (
                          <div className="flex items-center text-xs text-gray-500 gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{task.time}</span>
                          </div>
                        )}
                        
                        <div className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
            ) : (
              <div className="py-12 text-center">
                <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No tasks scheduled</h3>
                <p className="text-sm text-muted-foreground mt-1">Add tasks to plan your day</p>
              </div>
            )}
          </div>
        </Tile>
        
        <div className="space-y-6">
          <Tile title="Calendar" delay={1}>
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 text-primary mx-auto mb-4 opacity-70" />
              <p className="text-sm text-muted-foreground">
                Calendar integration will be available soon
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.href = "/calendar"}>
                Go to calendar
              </Button>
            </div>
          </Tile>
          
          <Tile title="Productivity Tips" delay={2}>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                <span>Plan your most important tasks for the morning</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                <span>Take short breaks every 25-30 minutes</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                <span>Group similar tasks together for better focus</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                <span>Review your plan at the end of the day</span>
              </li>
            </ul>
          </Tile>
        </div>
      </div>
    </div>
  );
};

export default Planner;
