
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, User, PaletteIcon, Bell, Moon, Sun, Globe, Volume2, Lock } from "lucide-react";
import Tile from "@/components/ui/Tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  // Get initial settings from localStorage or default values
  const getInitialSettings = () => {
    const savedSettings = localStorage.getItem('user-settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      darkMode: false,
      notifications: true,
      soundEffects: true,
      language: "english",
      themeColor: "blue",
      avatar: "default",
      dailyReminderTime: "08:00"
    };
  };
  
  const [activeTab, setActiveTab] = useState("appearance");
  const [settings, setSettings] = useState(getInitialSettings());
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
  
  // Apply dark mode when settings change
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save settings to localStorage whenever they change
    localStorage.setItem('user-settings', JSON.stringify(settings));
  }, [settings]);
  
  const { data: achievements = [] } = useQuery({
    queryKey: ["user-achievements"],
    queryFn: async () => {
      // Get user achievements that are unlocked
      const { data: userAchievements, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id);
      
      if (error) throw error;
      
      return [
        { id: "early-bird", name: "Early Bird", unlocked: userAchievements?.some(ua => ua.achievement_id === "early-bird"), reward: "Morning Theme" },
        { id: "night-owl", name: "Night Owl", unlocked: userAchievements?.some(ua => ua.achievement_id === "night-owl"), reward: "Dark Theme" },
        { id: "zen-mind", name: "Zen Mind", unlocked: userAchievements?.some(ua => ua.achievement_id === "zen-mind"), reward: "Zen Avatar" },
        { id: "focus-master", name: "Focus Master", unlocked: userAchievements?.some(ua => ua.achievement_id === "focus-master"), reward: "Productivity Avatar" }
      ];
    }
  });
  
  const availableThemes = [
    { id: "blue", name: "Default Blue", requiresAchievement: false },
    { id: "green", name: "Forest Green", requiresAchievement: false },
    { id: "purple", name: "Royal Purple", requiresAchievement: false },
    { id: "morning", name: "Morning Sunrise", requiresAchievement: true, achievement: "early-bird" },
    { id: "night", name: "Night Owl", requiresAchievement: true, achievement: "night-owl" }
  ];
  
  const availableAvatars = [
    { id: "default", name: "Default", requiresAchievement: false },
    { id: "zen", name: "Zen Master", requiresAchievement: true, achievement: "zen-mind" },
    { id: "productivity", name: "Productivity Pro", requiresAchievement: true, achievement: "focus-master" }
  ];
  
  const updateUserProfileMutation = useMutation({
    mutationFn: async ({ displayName }: { displayName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase.auth.updateUser({
        data: { name: displayName }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
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
        title: "Password reset email sent",
        description: "Check your email for the password reset link."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const saveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem('user-settings', JSON.stringify(settings));
    
    // Update user profile if display name changed
    updateUserProfileMutation.mutate({ displayName });
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
    
    // Apply theme immediately
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  const isThemeAvailable = (themeId: string) => {
    const theme = availableThemes.find(t => t.id === themeId);
    if (!theme) return false;
    if (!theme.requiresAchievement) return true;
    
    return achievements.some(a => 
      a.id === theme.achievement && a.unlocked
    );
  };
  
  const isAvatarAvailable = (avatarId: string) => {
    const avatar = availableAvatars.find(a => a.id === avatarId);
    if (!avatar) return false;
    if (!avatar.requiresAchievement) return true;
    
    return achievements.some(a => 
      a.id === avatar.achievement && a.unlocked
    );
  };
  
  // Handle settings changes
  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Customize your experience</p>
      </motion.div>
      
      <Tabs defaultValue="appearance" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6 w-full md:w-auto">
          <TabsTrigger value="appearance" className="flex gap-2 items-center">
            <PaletteIcon className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex gap-2 items-center">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex gap-2 items-center">
            <User className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance" className="space-y-6">
          <Tile title="Theme Settings">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark theme
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Theme Color</Label>
                <div className="grid grid-cols-5 gap-3">
                  {availableThemes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => isThemeAvailable(theme.id) && updateSetting('themeColor', theme.id)}
                      className={`relative w-full aspect-square rounded-md border transition-all ${
                        settings.themeColor === theme.id 
                          ? 'ring-2 ring-primary ring-offset-2' 
                          : isThemeAvailable(theme.id) ? 'hover:border-primary/50' : 'opacity-40 cursor-not-allowed'
                      }`}
                      disabled={!isThemeAvailable(theme.id)}
                      title={
                        !isThemeAvailable(theme.id) && theme.requiresAchievement
                          ? `Unlock the ${theme.name} theme by completing the ${
                              achievements.find(a => a.id === theme.achievement)?.name
                            } achievement`
                          : theme.name
                      }
                    >
                      <div 
                        className={`w-full h-full rounded-md ${
                          theme.id === 'blue' ? 'bg-blue-500' :
                          theme.id === 'green' ? 'bg-green-500' :
                          theme.id === 'purple' ? 'bg-purple-500' :
                          theme.id === 'morning' ? 'bg-gradient-to-br from-orange-300 to-yellow-500' :
                          theme.id === 'night' ? 'bg-gradient-to-br from-indigo-900 to-purple-900' :
                          'bg-gray-500'
                        }`}
                      ></div>
                      {!isThemeAvailable(theme.id) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Some themes require achievements to unlock
                </p>
              </div>
              
              <div className="space-y-3">
                <Label>Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => updateSetting('language', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Tile>
          
          <Tile title="Avatar">
            <div className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {availableAvatars.map(avatar => (
                  <button
                    key={avatar.id}
                    onClick={() => isAvatarAvailable(avatar.id) && updateSetting('avatar', avatar.id)}
                    className={`relative rounded-full aspect-square border overflow-hidden ${
                      !isAvatarAvailable(avatar.id) ? 'opacity-40 cursor-not-allowed' : 
                      settings.avatar === avatar.id ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    disabled={!isAvatarAvailable(avatar.id)}
                    title={
                      !isAvatarAvailable(avatar.id) 
                        ? `Unlock by completing achievement` 
                        : avatar.name
                    }
                  >
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      {avatar.id === 'default' && <User className="h-8 w-8 text-primary/60" />}
                      {avatar.id === 'zen' && <div className="text-2xl">🧘</div>}
                      {avatar.id === 'productivity' && <div className="text-2xl">⚡</div>}
                    </div>
                    {!isAvatarAvailable(avatar.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Additional avatars are unlocked by earning achievements
              </p>
            </div>
          </Tile>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Tile title="Notification Settings">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for task reminders and achievements
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={(checked) => updateSetting('notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-effects">Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for completed tasks and achievements
                  </p>
                </div>
                <Switch
                  id="sound-effects"
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => updateSetting('soundEffects', checked)}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Daily Reminder Time</Label>
                <Input 
                  type="time" 
                  value={settings.dailyReminderTime}
                  onChange={(e) => updateSetting('dailyReminderTime', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Set a daily reminder to check your tasks
                </p>
              </div>
            </div>
          </Tile>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-6">
          <Tile title="Account Information">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input 
                  id="display-name" 
                  placeholder="Your name" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                  {resetPasswordMutation.isPending ? "Sending..." : "Reset Password"}
                </Button>
                <Button variant="destructive">
                  Delete Account
                </Button>
              </div>
            </div>
          </Tile>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button 
          onClick={saveSettings}
          disabled={updateUserProfileMutation.isPending}
        >
          {updateUserProfileMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
