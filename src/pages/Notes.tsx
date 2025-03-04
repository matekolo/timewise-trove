
import { useState } from "react";
import NotesHeader from "@/components/notes/NotesHeader";
import SearchBar from "@/components/notes/SearchBar";
import NoteList from "@/components/notes/NoteList";
import NoteDialog from "@/components/notes/NoteDialog";
import { useNotes } from "@/hooks/useNotes";

const Notes = () => {
  const colors = [
    "bg-blue-100 dark:bg-blue-900/50",
    "bg-green-100 dark:bg-green-900/50",
    "bg-yellow-100 dark:bg-yellow-900/50", 
    "bg-purple-100 dark:bg-purple-900/50",
    "bg-pink-100 dark:bg-pink-900/50",
  ];
  
  const {
    notes,
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
  } = useNotes(colors);

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
      <NotesHeader setIsDialogOpen={setIsDialogOpen} />
      
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <NoteList 
        notes={notes}
        onEdit={editNote}
        onDelete={deleteNote}
      />
      
      <NoteDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditMode={isEditMode}
        editId={editId}
        newNote={newNote}
        setNewNote={setNewNote}
        onAddOrUpdate={addOrUpdateNote}
        onReset={resetForm}
        colors={colors}
      />
    </div>
  );
};

export default Notes;
