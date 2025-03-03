
import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid, 
  Activity, 
  Calendar, 
  FileText, 
  BarChart, 
  Clock,
  User,
  Menu,
  X,
  BellRing
} from "lucide-react";
import WeatherWidget from "../ui/WeatherWidget";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if user is authenticated (this would be replaced with actual auth check)
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  
  useEffect(() => {
    // Check authentication status
    if (!isAuthenticated) {
      navigate("/auth");
    }
    
    // Handle responsive sidebar
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
    
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [isAuthenticated, navigate]);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const showNotification = () => {
    toast({
      title: "Notifications",
      description: "You have no new notifications",
    });
  };
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutGrid },
    { path: "/habits", label: "Habits", icon: Activity },
    { path: "/planner", label: "Planner", icon: Clock },
    { path: "/notes", label: "Notes", icon: FileText },
    { path: "/calendar", label: "Calendar", icon: Calendar },
    { path: "/reports", label: "Reports", icon: BarChart },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-64 bg-white border-r border-border h-screen fixed left-0 top-0 z-30 shadow-sm"
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
                            : "text-gray-600 hover:bg-gray-100"
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
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : ""}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-border sticky top-0 z-20 flex items-center justify-between px-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-medium">
              {navItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={showNotification} 
              className="relative"
            >
              <BellRing className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full"></span>
            </Button>
            
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </header>
        
        {/* Page content */}
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
