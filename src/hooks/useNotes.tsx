
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  created_at: string;
  user_id: string;
}

export const useNotes = (colors: string[]) => {
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
      updateNoteMutation.mutate({
        id: editId,
        note: newNote,
      });
    } else {
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

  return {
    notes: filteredNotes,
    isLoading,
    error,
    newNote,
    setNewNote,
    searchQuery,
    setSearchQuery,
    isDialogOpen,
    setIsDialogOpen,
    isEditMode,
    editId,
    addOrUpdateNote,
    deleteNote,
    editNote,
    resetForm
  };
};
