
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Tile from "@/components/ui/Tile";
import { useLanguage } from "@/contexts/LanguageContext"; 
import { UserSettings } from "@/hooks/useUserSettings";

interface NotificationSettingsProps {
  settings: UserSettings;
  updateSetting: (key: keyof UserSettings, value: any) => void;
}

const NotificationSettings = ({ settings, updateSetting }: NotificationSettingsProps) => {
  const { t } = useLanguage();

  return (
    <Tile title="Notification Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">{t("notifications")}</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications for task reminders and achievements
            </p>
          </div>
          <Switch
            id="notifications"
            checked={settings.notifications}
            onCheckedChange={(checked) => updateSetting('notifications', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sound-effects">{t("soundEffects")}</Label>
            <p className="text-sm text-muted-foreground">
              Play sounds for completed tasks and achievements
            </p>
          </div>
          <Switch
            id="sound-effects"
            checked={settings.soundEffects}
            onCheckedChange={(checked) => updateSetting('soundEffects', checked)}
          />
        </div>
        
        <div className="space-y-3">
          <Label>{t("dailyReminder")}</Label>
          <Input 
            type="time" 
            value={settings.dailyReminderTime}
            onChange={(e) => updateSetting('dailyReminderTime', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Set a daily reminder to check your tasks
          </p>
        </div>
      </div>
    </Tile>
  );
};

export default NotificationSettings;

