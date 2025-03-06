import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid, 
  Activity, 
  FileText, 
  BarChart, 
  Clock,
  User,
  Menu,
  X,
  BellRing,
  LogOut,
  Trophy,
  Settings as SettingsIcon
} from "lucide-react";
import WeatherWidget from "../ui/WeatherWidget";
import UserAvatar from "../ui/UserAvatar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        setIsAuthenticated(!!session);
        
        if (user) {
          setUserProfile({
            name: user.user_metadata?.name || user.email?.split('@')[0] || "",
            email: user.email
          });
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        
        if (session?.user) {
          setUserProfile({
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "",
            email: session.user.email
          });
        }
      }
    );
    
    const savedSettings = localStorage.getItem('user-settings');
    if (savedSettings) {
      setUserSettings(JSON.parse(savedSettings));
    }
    
    const handleStorageChange = () => {
      const updatedSettings = localStorage.getItem('user-settings');
      if (updatedSettings) {
        setUserSettings(JSON.parse(updatedSettings));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    return () => {
      window.removeEventListener("resize", checkScreenSize);
      window.removeEventListener('storage', handleStorageChange);
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const checkSettings = () => {
      const savedSettings = localStorage.getItem('user-settings');
      if (savedSettings) {
        setUserSettings(JSON.parse(savedSettings));
      }
    };
    
    const interval = setInterval(checkSettings, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, loading, navigate]);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const showNotification = () => {
    toast({
      title: "Notifications",
      description: "You have no new notifications",
    });
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "There was an error signing out",
        variant: "destructive",
      });
    }
  };
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutGrid },
    { path: "/habits", label: "Habits", icon: Activity },
    { path: "/planner", label: "Planner", icon: Clock },
    { path: "/notes", label: "Notes", icon: FileText },
    { path: "/reports", label: "Reports", icon: BarChart },
    { path: "/achievements", label: "Achievements", icon: Trophy },
    { path: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  const getAvatarContent = () => {
    if (!userSettings || !userSettings.avatar) return <User className="h-6 w-6" />;
    
    switch (userSettings.avatar) {
      case 'zen':
        return <div className="text-lg">🧘</div>;
      case 'productivity':
        return <div className="text-lg">⚡</div>;
      default:
        return userProfile?.name?.charAt(0).toUpperCase() || <User className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to auth page
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-64 bg-white dark:bg-gray-800 border-r border-border h-screen fixed left-0 top-0 z-30 shadow-sm"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h1 className="font-semibold text-lg">Timewise</h1>
                {isMobile && (
                  <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
              
              <div className="py-6 px-3 flex-1 overflow-y-auto">
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`
                      }
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
              
              <div className="p-4 border-t mt-auto">
                <WeatherWidget />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : ""}`}>
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-border sticky top-0 z-20 flex items-center justify-between px-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-medium">
              {navItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={showNotification} 
              className="relative"
            >
              <BellRing className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full"></span>
            </Button>
            
            <UserAvatar showDisplayName={true} />
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        
        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
