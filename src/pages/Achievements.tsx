
import { useState } from "react";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAchievements } from "@/hooks/useAchievements";
import AchievementCard from "@/components/achievements/AchievementCard";
import AchievementFilter from "@/components/achievements/AchievementFilter";

const Achievements = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { t } = useLanguage();
  const { achievements, claimReward, claimAchievementMutation } = useAchievements();
  
  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "unlocked") return achievement.unlocked;
    if (selectedCategory === "locked") return !achievement.unlocked;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold">{t("achievements")}</h1>
          <p className="text-muted-foreground">Track your progress and earn rewards</p>
        </motion.div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => navigate("/settings")}
        >
          <Settings className="h-4 w-4" />
          <span>{t("settings")}</span>
        </Button>
      </div>
      
      <AchievementFilter 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement, index) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            claimReward={claimReward}
            isPending={claimAchievementMutation.isPending}
            pendingId={claimAchievementMutation.variables}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default Achievements;
