
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  created_at: string;
  user_id: string;
}

interface NoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  editId: string | null;
  newNote: Omit<Note, "id" | "created_at" | "user_id">;
  setNewNote: React.Dispatch<React.SetStateAction<Omit<Note, "id" | "created_at" | "user_id">>>;
  onAddOrUpdate: () => Promise<void>;
  onReset: () => void;
  colors: string[];
}

const NoteDialog = ({
  isOpen,
  onOpenChange,
  isEditMode,
  editId,
  newNote,
  setNewNote,
  onAddOrUpdate,
  onReset,
  colors
}: NoteDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) onReset();
    }}>
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
              onOpenChange(false);
              onReset();
            }}
          >
            Cancel
          </Button>
          <Button onClick={onAddOrUpdate}>
            {isEditMode ? "Update Note" : "Add Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoteDialog;
