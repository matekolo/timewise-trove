
import Tile from "@/components/ui/Tile";
import { useLanguage } from "@/contexts/LanguageContext"; 
import { UserSettings } from "@/hooks/useUserSettings";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationToggle from "@/components/settings/notifications/NotificationToggle";
import SoundEffectsToggle from "@/components/settings/notifications/SoundEffectsToggle";
import DailyReminderTime from "@/components/settings/notifications/DailyReminderTime";
import NotificationPermissionStatus from "@/components/settings/notifications/NotificationPermissionStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { showNotificationToast } from "@/utils/toastUtils";
import { Button } from "@/components/ui/button";

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
  
  // Add a function to test global toast visibility
  const testGlobalToast = () => {
    showNotificationToast(
      "Global Toast Test", 
      "This toast should be visible throughout the entire application."
    );
  };

  return (
    <Tile title={t("notificationSettings")}>
      <div className="space-y-6">
        {settings.notifications && notificationPermission === "granted" && (
          <Alert variant="default" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <InfoIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Notifications are enabled. You will now receive notifications for tasks and daily reminders.
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
        />
        
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testGlobalToast}
          >
            Test Global Toast
          </Button>
          
          {settings.notifications && notificationPermission === "granted" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={manuallyCheckOverdueTasks}
            >
              Check For Due Tasks
            </Button>
          )}
        </div>
      </div>
    </Tile>
  );
};

export default NotificationSettings;
