
import NoteCard from "./NoteCard";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  created_at: string;
  user_id: string;
}

interface NoteListProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

const NoteList = ({ notes, onEdit, onDelete }: NoteListProps) => {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No notes found</h3>
        <p className="text-muted-foreground mt-1">
          {notes.length === 0 ? "Add your first note to get started" : "Try different search terms"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {notes.map((note, index) => (
        <NoteCard
          key={note.id}
          note={note}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default NoteList;
