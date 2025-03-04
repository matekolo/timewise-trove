
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";

interface SoundEffectsToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const SoundEffectsToggle = ({ 
  checked, 
  onCheckedChange 
}: SoundEffectsToggleProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="sound-effects">{t("soundEffects")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("soundEffectsDesc")}
        </p>
      </div>
      <Switch
        id="sound-effects"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
};

export default SoundEffectsToggle;
