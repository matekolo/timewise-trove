
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Tile from "@/components/ui/Tile";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AccountSettingsProps {
  displayName: string;
  setDisplayName: (name: string) => void;
  email: string;
  saveUserProfile: (displayName: string) => Promise<any>;
}

const AccountSettings = ({ 
  displayName, 
  setDisplayName, 
  email, 
  saveUserProfile 
}: AccountSettingsProps) => {
  const { t } = useLanguage();

  const updateUserProfileMutation = useMutation({
    mutationFn: async () => {
      const result = await saveUserProfile(displayName);
      return result;
    },
    onSuccess: () => {
      toast({
        title: t("profileUpdated"),
        description: "Your profile has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });
  
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: t("passwordResetSent"),
        description: "Check your email for the password reset link."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  return (
    <Tile title="Account Information">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display-name">{t("displayName")}</Label>
          <Input 
            id="display-name" 
            placeholder="Your name" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="your.email@example.com" 
            value={email}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed
          </p>
        </div>
        
        <div className="pt-4 flex justify-end">
          <Button 
            variant="outline" 
            className="mr-2"
            onClick={() => resetPasswordMutation.mutate()}
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? t("pleaseWait") : t("resetPassword")}
          </Button>
          <Button variant="destructive">
            {t("deleteAccount")}
          </Button>
        </div>
      </div>
    </Tile>
  );
};

export default AccountSettings;
