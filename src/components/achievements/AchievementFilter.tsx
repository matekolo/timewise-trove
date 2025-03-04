
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface AchievementFilterProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const AchievementFilter = ({ selectedCategory, setSelectedCategory }: AchievementFilterProps) => {
  const { t } = useLanguage();
  
  const categories = [
    { id: "all", name: t("all") },
    { id: "unlocked", name: t("unlocked") },
    { id: "locked", name: t("locked") }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(category => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};

export default AchievementFilter;
