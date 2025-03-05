
import { Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChampionBadgeProps {
  className?: string;
}

const ChampionBadge = ({ className }: ChampionBadgeProps) => {
  return (
    <Badge variant="success" className={`flex items-center gap-1 ${className}`}>
      <Award className="h-3 w-3" />
      <span>Champion</span>
    </Badge>
  );
};

export default ChampionBadge;
