
import Tile from "@/components/ui/Tile";
import { useLanguage } from "@/contexts/LanguageContext"; 
import { UserSettings } from "@/hooks/useUserSettings";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationToggle from "@/components/settings/notifications/NotificationToggle";
import SoundEffectsToggle from "@/components/settings/notifications/SoundEffectsToggle";
import DailyReminderTime from "@/components/settings/notifications/DailyReminderTime";
import NotificationPermissionStatus from "@/components/settings/notifications/NotificationPermissionStatus";

interface NotificationSettingsProps {
  settings: UserSettings;
  updateSetting: (key: keyof UserSettings, value: any) => void;
}

const NotificationSettings = ({ settings, updateSetting }: NotificationSettingsProps) => {
  const { t } = useLanguage();
  const { 
    notificationSupported,
    notificationPermission,
    handleNotificationChange,
    requestNotificationPermission,
    triggerTestNotification
  } = useNotifications(settings, updateSetting);

  const handleSoundEffectChange = (checked: boolean) => {
    updateSetting('soundEffects', checked);
    if (checked) {
      const audio = new Audio("/notification-sound.mp3");
      audio.play().catch(error => {
        console.error("Error playing notification sound:", error);
      });
    }
  };

  const handleReminderTimeChange = (time: string) => {
    updateSetting('dailyReminderTime', time);
  };

  return (
    <Tile title={t("notificationSettings")}>
      <div className="space-y-6">
        <NotificationToggle 
          checked={settings.notifications}
          onCheckedChange={handleNotificationChange}
          disabled={!notificationSupported}
        />
        
        <SoundEffectsToggle 
          checked={settings.soundEffects}
          onCheckedChange={handleSoundEffectChange}
        />
        
        <DailyReminderTime 
          value={settings.dailyReminderTime}
          disabled={!settings.notifications}
          onChange={handleReminderTimeChange}
        />
        
        <NotificationPermissionStatus 
          permission={notificationPermission}
          onRequestPermission={requestNotificationPermission}
          onTestNotification={triggerTestNotification}
        />
      </div>
    </Tile>
  );
};

export default NotificationSettings;
