
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";

interface NotificationToggleProps {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const NotificationToggle = ({ 
  checked, 
  disabled = false, 
  onCheckedChange 
}: NotificationToggleProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="notifications">{t("notifications")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("notificationsDesc")}
        </p>
      </div>
      <Switch
        id="notifications"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
};

export default NotificationToggle;
