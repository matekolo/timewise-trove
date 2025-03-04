
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  console.log("Current toasts:", toasts.length);
  
  if (toasts.length > 0) {
    console.log("Toasts available:", toasts.map(t => `${t.id}: ${t.title}`).join(', '));
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        console.log("Rendering toast:", id, title);
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport className="fixed bottom-0 right-0 flex flex-col p-4 gap-2 w-full md:max-w-[420px] z-50 outline-none" />
    </ToastProvider>
  );
}
