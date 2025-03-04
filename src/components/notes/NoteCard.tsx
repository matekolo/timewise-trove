
import { motion } from "framer-motion";
import { MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Tile from "@/components/ui/Tile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  created_at: string;
  user_id: string;
}

interface NoteCardProps {
  note: Note;
  index: number;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

const NoteCard = ({ note, index, onEdit, onDelete }: NoteCardProps) => {
  return (
    <motion.div
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
                  onClick={() => onEdit(note)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => onDelete(note.id)}
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
  );
};

export default NoteCard;
