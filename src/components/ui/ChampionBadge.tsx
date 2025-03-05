
import { Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChampionBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

const ChampionBadge = ({ className, size = 'md' }: ChampionBadgeProps) => {
  const isSmall = size === 'sm';
  
  return (
    <Badge 
      variant="success" 
      className={cn(
        "flex items-center gap-1", 
        isSmall ? "px-1.5 py-0" : "px-2 py-0.5",
        className
      )}
    >
      <Award className={isSmall ? "h-2.5 w-2.5" : "h-3 w-3"} />
      <span className={isSmall ? "text-[10px]" : "text-xs"}>Champion</span>
    </Badge>
  );
};

export default ChampionBadge;
