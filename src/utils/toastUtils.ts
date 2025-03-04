
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
  // Ensure toast is triggered outside of any component rendering cycle
  // This is critical for global visibility across routes
  setTimeout(() => {
    console.log("Showing toast:", props.title);
    hookToast({
      ...props,
      // Longer duration for better visibility
      duration: 10000,
    });
  }, 0);
};

// Convenience methods for common toast types
export const showSuccessToast = (title: string, description?: string) => {
  console.log("Showing success toast:", title, description);
  showToast({ title, description, variant: "default" });
};

export const showErrorToast = (title: string, description?: string) => {
  console.log("Showing error toast:", title, description);
  showToast({ title, description, variant: "destructive" });
};

export const showNotificationToast = (title: string, description?: string) => {
  // Play notification sound (if available)
  try {
    const audio = new Audio("/notification-sound.mp3");
    audio.play().catch(error => {
      console.error("Error playing notification sound:", error);
    });
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
  
  console.log("Showing notification toast:", title, description);
  showToast({ title, description, variant: "default" });
};
