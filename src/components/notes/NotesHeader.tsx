
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";

interface NotesHeaderProps {
  setIsDialogOpen: (open: boolean) => void;
}

const NotesHeader = ({ setIsDialogOpen }: NotesHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Notes</h1>
        <p className="text-muted-foreground">Capture your thoughts and ideas</p>
      </motion.div>
      
      <Button 
        className="flex items-center gap-2"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="h-4 w-4" />
        <span>Add Note</span>
      </Button>
    </div>
  );
};

export default NotesHeader;
