
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
  const { achievements, claimReward, claimAchievementMutation, isLoading } = useAchievements();
  
  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "unlocked") return achievement.unlocked;
    if (selectedCategory === "locked") return !achievement.unlocked;
    if (selectedCategory === "claimed") return achievement.claimed;
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const claimedCount = achievements.filter(a => a.claimed).length;
  const totalCount = achievements.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold">{t("achievements")}</h1>
          <p className="text-muted-foreground">
            Track your progress and earn rewards - {claimedCount}/{unlockedCount} claimed, {unlockedCount}/{totalCount} unlocked
          </p>
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
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.length > 0 ? (
            filteredAchievements.map((achievement, index) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                claimReward={claimReward}
                isPending={claimAchievementMutation.isPending}
                pendingId={claimAchievementMutation.variables}
                index={index}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-lg text-muted-foreground">No achievements found in this category</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Achievements;
