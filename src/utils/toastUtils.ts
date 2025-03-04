
import { toast as hookToast } from "@/hooks/use-toast";

/**
 * Helper function to show toast notifications consistently across the app.
 * This ensures all toasts are properly displayed regardless of component hierarchy.
 */
export const showToast = (props: {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}) => {
  // Use setTimeout to ensure the toast is triggered outside of React rendering
  setTimeout(() => {
    hookToast({
      ...props,
      // Force longer display duration for important notifications
      duration: 8000, 
    });
  }, 0);
};

// Convenience methods for common toast types
export const showSuccessToast = (title: string, description?: string) => {
  showToast({ title, description, variant: "default" });
};

export const showErrorToast = (title: string, description?: string) => {
  showToast({ title, description, variant: "destructive" });
};

export const showNotificationToast = (title: string, description?: string) => {
  // Play notification sound (this could be made configurable)
  try {
    const audio = new Audio("/notification-sound.mp3");
    audio.play().catch(console.error);
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
  
  showToast({ title, description, variant: "default" });
};
