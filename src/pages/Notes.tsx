
import { useState } from "react";
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

interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  date: string;
}

const Notes = () => {
  const colors = [
    "bg-blue-100",
    "bg-green-100",
    "bg-yellow-100",
    "bg-purple-100",
    "bg-pink-100",
  ];
  
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "Meeting notes",
      content: "Discuss the new project timeline with the team. Remember to bring up the budget concerns.",
      color: "bg-blue-100",
      date: "2023-05-15",
    },
    {
      id: 2,
      title: "Ideas for the presentation",
      content: "- Start with company vision\n- Show growth metrics\n- End with future roadmap",
      color: "bg-yellow-100",
      date: "2023-05-12",
    },
    {
      id: 3,
      title: "Books to read",
      content: "1. Atomic Habits\n2. Deep Work\n3. The Psychology of Money",
      color: "bg-green-100",
      date: "2023-05-10",
    },
  ]);
  
  const [newNote, setNewNote] = useState<Omit<Note, "id" | "date">>({
    title: "",
    content: "",
    color: colors[0],
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const addOrUpdateNote = () => {
    if (newNote.title.trim() === "") {
      toast({
        title: "Please enter a note title",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditMode && editId !== null) {
      // Update existing note
      setNotes(
        notes.map((note) =>
          note.id === editId
            ? {
                ...note,
                title: newNote.title,
                content: newNote.content,
                color: newNote.color,
              }
            : note
        )
      );
      
      toast({
        title: "Note updated",
        description: "Your note has been updated.",
      });
    } else {
      // Add new note
      const note: Note = {
        id: Date.now(),
        ...newNote,
        date: new Date().toISOString().split("T")[0],
      };
      
      setNotes([note, ...notes]);
      
      toast({
        title: "Note added",
        description: "Your note has been saved.",
      });
    }
    
    // Reset form
    setNewNote({
      title: "",
      content: "",
      color: colors[0],
    });
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditId(null);
  };
  
  const deleteNote = (noteId: number) => {
    setNotes(notes.filter((note) => note.id !== noteId));
    toast({
      title: "Note deleted",
      description: "Your note has been deleted.",
    });
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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setIsEditMode(false);
                setEditId(null);
                setNewNote({
                  title: "",
                  content: "",
                  color: colors[0],
                });
              }}>
                Cancel
              </Button>
              <Button onClick={addOrUpdateNote}>
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
                  {new Date(note.date).toLocaleDateString()}
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
