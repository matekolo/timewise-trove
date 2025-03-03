
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MoreHorizontal, Trash2, Edit } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  created_at: string;
  user_id: string;
}

const Notes = () => {
  const colors = [
    "bg-blue-100",
    "bg-green-100",
    "bg-yellow-100",
    "bg-purple-100",
    "bg-pink-100",
  ];
  
  const [newNote, setNewNote] = useState<Omit<Note, "id" | "created_at" | "user_id">>({
    title: "",
    content: "",
    color: colors[0],
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Fetch notes from Supabase
  const fetchNotes = async (): Promise<Note[]> => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching notes:", error);
      throw error;
    }
    
    return data || [];
  };
  
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ["notes"],
    queryFn: fetchNotes,
  });
  
  // Add a new note
  const addNoteMutation = useMutation({
    mutationFn: async (note: Omit<Note, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("notes")
        .insert(note)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      resetForm();
      setIsDialogOpen(false);
      
      toast({
        title: "Note added",
        description: "Your note has been saved.",
      });
    },
    onError: (error) => {
      console.error("Error adding note:", error);
      toast({
        title: "Error adding note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update a note
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: Omit<Note, "id" | "created_at" | "user_id"> }) => {
      const { data, error } = await supabase
        .from("notes")
        .update(note)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      resetForm();
      setIsDialogOpen(false);
      
      toast({
        title: "Note updated",
        description: "Your note has been updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating note:", error);
      toast({
        title: "Error updating note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete a note
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast({
        title: "Note deleted",
        description: "Your note has been deleted.",
      });
    },
    onError: (error) => {
      console.error("Error deleting note:", error);
      toast({
        title: "Error deleting note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const resetForm = () => {
    setNewNote({
      title: "",
      content: "",
      color: colors[0],
    });
    setIsEditMode(false);
    setEditId(null);
  };
  
  const addOrUpdateNote = async () => {
    if (newNote.title.trim() === "") {
      toast({
        title: "Please enter a note title",
        variant: "destructive",
      });
      return;
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to add notes",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditMode && editId !== null) {
      // Update existing note
      updateNoteMutation.mutate({
        id: editId,
        note: newNote,
      });
    } else {
      // Add new note with user_id included
      addNoteMutation.mutate({
        ...newNote,
        user_id: user.id
      });
    }
  };
  
  const deleteNote = (noteId: string) => {
    deleteNoteMutation.mutate(noteId);
  };
  
  const editNote = (note: Note) => {
    setNewNote({
      title: note.title,
      content: note.content,
      color: note.color,
    });
    setIsEditMode(true);
    setEditId(note.id);
    setIsDialogOpen(true);
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
        <h3 className="text-lg font-medium text-red-600">Error loading notes</h3>
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
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Capture your thoughts and ideas</p>
        </motion.div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Note</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit note" : "Add a new note"}</DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Make changes to your note"
                  : "Create a new note to save your thoughts"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  placeholder="E.g., Meeting notes"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  placeholder="Write your note here..."
                  rows={6}
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full ${color} ${
                        newNote.color === color
                          ? "ring-2 ring-primary ring-offset-2"
                          : ""
                      }`}
                      onClick={() => setNewNote({ ...newNote, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={addOrUpdateNote}
                disabled={addNoteMutation.isPending || updateNoteMutation.isPending}
              >
                {isEditMode ? "Update Note" : "Add Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note, index) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Tile className={`h-full ${note.color} border-transparent`}>
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{note.title}</h3>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => editNote(note)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="mt-2 flex-1">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {note.content}
                  </p>
                </div>
                
                <div className="mt-4 pt-2 border-t border-black/5 text-xs text-gray-500">
                  {new Date(note.created_at).toLocaleDateString()}
                </div>
              </div>
            </Tile>
          </motion.div>
        ))}
      </div>
      
      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No notes found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery
              ? "Try different search terms"
              : "Add your first note to get started"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Notes;
