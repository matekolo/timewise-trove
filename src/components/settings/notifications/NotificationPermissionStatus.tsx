
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface NotificationPermissionStatusProps {
  permission: NotificationPermission | null;
  onRequestPermission: () => void;
  onTestNotification: () => void;
}

const NotificationPermissionStatus = ({ 
  permission, 
  onRequestPermission,
  onTestNotification
}: NotificationPermissionStatusProps) => {
  const queryClient = useQueryClient();
  
  const handleRefreshTaskNotifications = () => {
    console.log("Manually refreshing task notifications");
    queryClient.invalidateQueries({ queryKey: ["upcoming-tasks"] });
    toast({
      title: "Refreshing task notifications",
      description: "Task notifications have been refreshed",
    });
  };
  
  return (
    <>
      <div className="pt-2 pb-1 border-t border-gray-200 dark:border-gray-800">
        <p className="text-sm font-medium">Notification Permission: {permission || "unknown"}</p>
        {permission === "denied" && (
          <p className="text-xs text-red-500 mt-1">
            Notifications are blocked by your browser. Please update your browser settings to allow notifications.
          </p>
        )}
        {permission === "granted" && (
          <p className="text-xs text-green-500 mt-1">
            Notifications are enabled. You will receive notifications for tasks and reminders.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRequestPermission}
        >
          Request Permission
        </Button>
        
        {permission === "granted" && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onTestNotification}
            >
              Send Test Notification
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshTaskNotifications}
              className="flex items-center gap-1"
            >
              <RefreshCcw className="h-3 w-3" />
              Refresh Task Notifications
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default NotificationPermissionStatus;
