
import Tile from "@/components/ui/Tile";
import { useLanguage } from "@/contexts/LanguageContext"; 
import { UserSettings } from "@/hooks/useUserSettings";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationToggle from "@/components/settings/notifications/NotificationToggle";
import SoundEffectsToggle from "@/components/settings/notifications/SoundEffectsToggle";
import DailyReminderTime from "@/components/settings/notifications/DailyReminderTime";
import NotificationPermissionStatus from "@/components/settings/notifications/NotificationPermissionStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoCircled } from "@radix-ui/react-icons";

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
    triggerTestNotification,
    manuallyCheckOverdueTasks
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
        {settings.notifications && notificationPermission === "granted" && (
          <Alert variant="default" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <InfoCircled className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Notifications are enabled. You can test them using the "Send Test Notification" button below.
            </AlertDescription>
          </Alert>
        )}

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
          onManuallyCheckOverdueTasks={manuallyCheckOverdueTasks}
        />
      </div>
    </Tile>
  );
};

export default NotificationSettings;
