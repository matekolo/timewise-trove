
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Tile from "@/components/ui/Tile";
import { useLanguage } from "@/contexts/LanguageContext"; 
import { UserSettings } from "@/hooks/useUserSettings";
import { toast } from "@/components/ui/use-toast";

interface NotificationSettingsProps {
  settings: UserSettings;
  updateSetting: (key: keyof UserSettings, value: any) => void;
}

const NotificationSettings = ({ settings, updateSetting }: NotificationSettingsProps) => {
  const { t } = useLanguage();

  const handleNotificationChange = async (checked: boolean) => {
    if (checked) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          updateSetting('notifications', true);
          toast({
            title: t("notificationsEnabled"),
            description: t("notificationsEnabledDesc"),
          });
        } else {
          toast({
            title: t("notificationsBlocked"),
            description: t("notificationsBlockedDesc"),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        toast({
          title: t("error"),
          description: t("notificationError"),
          variant: "destructive",
        });
      }
    } else {
      updateSetting('notifications', false);
    }
  };

  const handleSoundEffectChange = (checked: boolean) => {
    updateSetting('soundEffects', checked);
    if (checked) {
      // Play a test sound
      const audio = new Audio("/notification-sound.mp3");
      audio.play().catch(console.error);
    }
  };

  const handleReminderTimeChange = (time: string) => {
    updateSetting('dailyReminderTime', time);
    if (settings.notifications) {
      toast({
        title: t("reminderSet"),
        description: t("reminderSetDesc").replace('{time}', time),
      });
    }
  };

  return (
    <Tile title={t("notificationSettings")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">{t("notifications")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("notificationsDesc")}
            </p>
          </div>
          <Switch
            id="notifications"
            checked={settings.notifications}
            onCheckedChange={handleNotificationChange}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sound-effects">{t("soundEffects")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("soundEffectsDesc")}
            </p>
          </div>
          <Switch
            id="sound-effects"
            checked={settings.soundEffects}
            onCheckedChange={handleSoundEffectChange}
          />
        </div>
        
        <div className="space-y-3">
          <Label>{t("dailyReminder")}</Label>
          <Input 
            type="time" 
            value={settings.dailyReminderTime}
            onChange={(e) => handleReminderTimeChange(e.target.value)}
            disabled={!settings.notifications}
          />
          <p className="text-xs text-muted-foreground">
            {settings.notifications ? t("dailyReminderDesc") : t("enableNotificationsFirst")}
          </p>
        </div>
      </div>
    </Tile>
  );
};

export default NotificationSettings;
