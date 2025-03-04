
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";

interface DailyReminderTimeProps {
  value: string;
  disabled: boolean;
  onChange: (time: string) => void;
}

const DailyReminderTime = ({ 
  value, 
  disabled,
  onChange 
}: DailyReminderTimeProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <Label>{t("dailyReminder")}</Label>
      <Input 
        type="time" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">
        {!disabled ? t("dailyReminderDesc") : t("enableNotificationsFirst")}
      </p>
    </div>
  );
};

export default DailyReminderTime;
