
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettingsAchievements } from "@/hooks/useSettingsAchievements";

// Import the component files
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import AccountSettings from "@/components/settings/AccountSettings";

const Settings = () => {
  const { t } = useLanguage();
  
  // Use our hook for settings management
  const { settings, updateSetting, saveUserProfile } = useUserSettings();
  const { achievements } = useSettingsAchievements();
  
  const [activeTab, setActiveTab] = useState("appearance");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  
  // Load user data
  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        // Get user's display name from metadata or email
        setDisplayName(user.user_metadata?.name || user.email?.split('@')[0] || "");
      }
    };
    
    loadUserProfile();
  }, []);
  
  const saveSettings = () => {
    // Update user profile if display name changed
    saveUserProfile(displayName);
    
    toast({
      title: t("settingsSaved"),
      description: "Your preferences have been updated.",
      duration: 5000,
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">{t("settings")}</h1>
        <p className="text-muted-foreground">Customize your experience</p>
      </motion.div>
      
      <Tabs defaultValue="appearance" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6 w-full md:w-auto">
          <TabsTrigger value="appearance" className="flex gap-2 items-center">
            <SettingsIcon className="h-4 w-4" />
            <span>{t("appearance")}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex gap-2 items-center">
            <SettingsIcon className="h-4 w-4" />
            <span>{t("notifications")}</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex gap-2 items-center">
            <SettingsIcon className="h-4 w-4" />
            <span>{t("account")}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance">
          <AppearanceSettings 
            settings={settings} 
            updateSetting={updateSetting} 
            displayName={displayName} 
            achievements={achievements} 
          />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationSettings 
            settings={settings} 
            updateSetting={updateSetting} 
          />
        </TabsContent>
        
        <TabsContent value="account">
          <AccountSettings 
            displayName={displayName} 
            setDisplayName={setDisplayName} 
            email={email} 
            saveUserProfile={saveUserProfile} 
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button onClick={saveSettings}>
          {t("saveSettings")}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
