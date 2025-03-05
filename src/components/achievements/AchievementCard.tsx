import { motion } from "framer-motion";
import { Trophy, Award, Star, Check, Lock, SunIcon, MoonIcon } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Achievement } from "@/types/achievementTypes";
import { useLanguage } from "@/contexts/LanguageContext";

interface AchievementCardProps {
  achievement: Achievement;
  claimReward: (achievement: Achievement) => void;
  isPending: boolean;
  pendingId: string | undefined;
  index: number;
}

const AchievementCard = ({ 
  achievement, 
  claimReward, 
  isPending, 
  pendingId, 
  index 
}: AchievementCardProps) => {
  const { t } = useLanguage();

  // Helper to get milestone value based on achievement ID
  const getMilestoneValue = (id: string) => {
    switch (id) {
      case "zen-mind": return 5;
      case "focus-master": return 10;
      case "streak-master": return 7;
      case "task-champion": return 25;
      case "habit-breaker": return 3;
      case "early-bird": return 5;
      case "night-owl": return 10;
      case "consistency-king": return 14;
      default: return 5;
    }
  };

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case "sun": return <SunIcon className="h-5 w-5" />;
      case "target": return <div className="h-5 w-5 bg-primary/20 rounded-full flex items-center justify-center"><div className="h-3 w-3 bg-primary rounded-full"></div></div>;
      case "award": return <Award className="h-5 w-5" />;
      case "flame": return <div className="h-5 w-5 text-orange-500">🔥</div>;
      case "feather": return <div className="h-5 w-5">✒️</div>;
      case "scissors": return <div className="h-5 w-5">✂️</div>;
      case "crown": return <div className="h-5 w-5 text-yellow-500">👑</div>;
      case "moon": return <MoonIcon className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  // Calculate the correct progress value for display
  const milestone = getMilestoneValue(achievement.id);
  
  // If unlocked or claimed, always show 100% progress
  const displayProgressValue = achievement.unlocked || achievement.claimed ? 100 : achievement.progress;
  
  // Show correct count value (if unlocked, show the milestone value)
  const displayProgressCount = achievement.unlocked || achievement.claimed 
    ? milestone 
    : achievement.progressCount !== undefined 
      ? achievement.progressCount 
      : Math.round(achievement.progress * milestone / 100);

  // Get button attributes based on achievement state
  const getButtonAttributes = () => {
    if (isPending && achievement.id === pendingId) {
      return {
        variant: "default" as const,
        disabled: true,
        text: t("pleaseWait")
      };
    }
    
    if (achievement.claimed) {
      return {
        variant: "outline" as const,
        disabled: true,
        text: t("claimed")
      };
    }
    
    if (achievement.unlocked) {
      return {
        variant: "default" as const,
        disabled: false,
        text: t("claimReward")
      };
    }
    
    return {
      variant: "outline" as const,
      disabled: true,
      text: t("locked")
    };
  };

  const buttonAttrs = getButtonAttributes();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Tile 
        className={`h-full ${achievement.unlocked ? 'border-primary/20' : ''}`}
        contentClassName="p-5 flex flex-col h-full"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              achievement.unlocked || achievement.claimed
                ? 'bg-primary/20 text-primary' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>
              {achievement.claimed ? (
                <Check className="h-5 w-5" />
              ) : achievement.unlocked ? (
                <Trophy className="h-5 w-5" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </div>
            <div>
              <h3 className="font-medium">{achievement.name}</h3>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{t("progress")}</span>
                <span>
                  {`${displayProgressCount} / ${milestone}`}
                </span>
              </div>
              <Progress value={displayProgressValue} className="h-1.5" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="text-muted-foreground mt-0.5">
                  {getAchievementIcon(achievement.icon)}
                </div>
                <span className="text-xs">{achievement.criteria}</span>
              </div>
              
              <div className="flex items-start gap-2">
                <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                <span className="text-xs">{t("reward")}: <span className="font-medium">{achievement.reward}</span></span>
              </div>
            </div>
          </div>
          
          <Button
            variant={buttonAttrs.variant}
            size="sm"
            disabled={buttonAttrs.disabled}
            onClick={() => claimReward(achievement)}
            className={achievement.claimed ? "opacity-60" : ""}
          >
            {buttonAttrs.text}
          </Button>
        </div>
      </Tile>
    </motion.div>
  );
};

export default AchievementCard;
