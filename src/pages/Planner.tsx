import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Filter, Check, Trash2, Tag, Clock, CalendarIcon } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useNotifications } from "@/contexts/NotificationContext";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  time?: string;
  category?: string;
}

const taskCategories = [
  { value: "work", label: "Work" },
  { value: "personal", label: "Personal" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "finance", label: "Finance" },
  { value: "general", label: "General" },
];

const Planner = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeInput, setTimeInput] = useState("12:00");
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    priority: "medium",
    completed: false,
    category: "general",
  });
  const { settings } = useUserSettings();
  const { scheduleTaskNotifications } = useNotifications();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });
      
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

  useEffect(() => {
    if (settings.notifications && Notification.permission === "granted") {
      scheduleTaskNotifications();
    }
  }, [tasks, settings.notifications, scheduleTaskNotifications]);

  const addTaskMutation = useMutation({
    mutationFn: async (task: Omit<Task, "id">) => {
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
      queryClient.invalidateQueries({ queryKey: ["upcoming-tasks"] });
      
      toast({
        title: "Task added",
        description: `${newTask.title} has been added to your planner.`,
      });
      
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        completed: false,
        category: "general",
      });
      setIsDialogOpen(false);
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["upcoming-tasks"] });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["upcoming-tasks"] });
      
      toast({
        title: "Task deleted",
        description: "The task has been deleted from your planner.",
      });
    },
  });

  const addTask = async () => {
    if (!newTask.title) {
      toast({
        title: "Task title required",
        description: "Please add a title for your task",
        variant: "destructive",
      });
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to add tasks",
        variant: "destructive",
      });
      return;
    }
    
    const taskToAdd: Omit<Task, "id"> = {
      ...newTask as Omit<Task, "id">,
      user_id: user.id,
    };
    
    if (date) {
      const dateObj = new Date(date);
      if (showTimePicker && timeInput) {
        const [hours, minutes] = timeInput.split(':').map(Number);
        dateObj.setHours(hours, minutes);
      }
      taskToAdd.time = dateObj.toISOString();
    }
    
    addTaskMutation.mutate(taskToAdd);
  };

  const handleToggleTask = (task: Task) => {
    toggleCompleteMutation.mutate({ 
      taskId: task.id, 
      completed: !task.completed 
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const getPriorityColor = (priority: string) => {
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

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "work":
        return "bg-blue-100 text-blue-800";
      case "personal":
        return "bg-purple-100 text-purple-800";
      case "health":
        return "bg-green-100 text-green-800";
      case "education":
        return "bg-indigo-100 text-indigo-800";
      case "finance":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTasks = tasks
    .filter(task => {
      if (filter === "all") return true;
      if (filter === "completed") return task.completed;
      if (filter === "incomplete") return !task.completed;
      if (filter === "high") return task.priority === "high";
      return true;
    })
    .filter(task => {
      if (categoryFilter === "all") return true;
      return task.category === categoryFilter;
    })
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      
      return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold">Daily Planner</h1>
          <p className="text-muted-foreground">Organize and track your tasks</p>
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
                Create a new task for your daily planner
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task title</Label>
                <Input
                  id="task-title"
                  placeholder="E.g., Complete project report"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="task-description">Description (optional)</Label>
                <Input
                  id="task-description"
                  placeholder="Add more details about this task"
                  value={newTask.description || ""}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                
                <div className="space-y-2">
                  <Label htmlFor="task-category">Category</Label>
                  <Select
                    value={newTask.category}
                    onValueChange={(value) => 
                      setNewTask({ ...newTask, category: value })
                    }
                  >
                    <SelectTrigger id="task-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Due Date & Time (optional)</Label>
                <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal w-full"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <div className="rdp-root" onClick={e => e.stopPropagation()}>
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => {
                            setDate(newDate);
                          }}
                          initialFocus
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {date && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTimePicker(!showTimePicker)}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-4 w-4" />
                        {showTimePicker ? "Hide time" : "Add time"}
                      </Button>
                      
                      {showTimePicker && (
                        <Input
                          type="time"
                          value={timeInput}
                          onChange={(e) => setTimeInput(e.target.value)}
                          className="max-w-[120px]"
                        />
                      )}
                    </div>
                  )}
                </div>
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
      
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed
          </Button>
          <Button
            variant={filter === "incomplete" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("incomplete")}
          >
            Incomplete
          </Button>
          <Button
            variant={filter === "high" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("high")}
          >
            High Priority
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              <span>Category</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCategoryFilter("all")}>
              All Categories
            </DropdownMenuItem>
            {taskCategories.map((category) => (
              <DropdownMenuItem 
                key={category.value}
                onClick={() => setCategoryFilter(category.value)}
              >
                {category.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Tile className="p-0">
        <div className="divide-y">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading tasks...</p>
            </div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleTask(task)}
                    className={`w-5 h-5 rounded-full border ${
                      task.completed 
                        ? "bg-primary border-primary text-white flex items-center justify-center"
                        : "border-gray-300"
                    }`}
                  >
                    {task.completed && (
                      <Check className="h-3 w-3" />
                    )}
                  </button>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                        {task.title}
                      </span>
                      <div className={`text-xs px-1.5 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </div>
                      {task.category && (
                        <div className={`text-xs px-1.5 py-0.5 rounded-full ${getCategoryColor(task.category)}`}>
                          {task.category}
                        </div>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    
                    {task.time && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{format(new Date(task.time), "PPP")}</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{format(new Date(task.time), "p")}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No tasks found</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Add your first task
              </Button>
            </div>
          )}
        </div>
      </Tile>
    </div>
  );
};

export default Planner;
