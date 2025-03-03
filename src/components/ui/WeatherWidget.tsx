
import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Moon, MapPin, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WeatherData {
  location: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'night';
  temperature: number;
}

const WeatherWidget = () => {
  const [time, setTime] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [weather, setWeather] = useState<WeatherData>({
    location: localStorage.getItem('weather-location') || 'New York',
    condition: 'sunny',
    temperature: 22
  });
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000);
    
    // For demo purposes, randomly change weather condition
    const weatherTimer = setInterval(() => {
      const conditions: Array<'sunny' | 'cloudy' | 'rainy' | 'night'> = ['sunny', 'cloudy', 'rainy', 'night'];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      const randomTemp = Math.floor(Math.random() * 15) + 15; // Temperature between 15-30
      
      setWeather(prev => ({
        ...prev,
        condition: randomCondition,
        temperature: randomTemp
      }));
    }, 30000);
    
    return () => {
      clearInterval(timer);
      clearInterval(weatherTimer);
    };
  }, []);
  
  // Format time to HH:MM
  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Format date to Day, Month Date
  const formattedDate = time.toLocaleDateString([], { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const weatherIcons = {
    sunny: <Sun className="h-6 w-6 text-yellow-500" />,
    cloudy: <Cloud className="h-6 w-6 text-gray-500" />,
    rainy: <CloudRain className="h-6 w-6 text-blue-500" />,
    night: <Moon className="h-6 w-6 text-indigo-400" />
  };
  
  const weatherTexts = {
    sunny: 'Sunny',
    cloudy: 'Cloudy',
    rainy: 'Rainy',
    night: 'Clear night'
  };
  
  const changeLocation = () => {
    if (locationInput.trim()) {
      setWeather(prev => ({
        ...prev,
        location: locationInput
      }));
      localStorage.setItem('weather-location', locationInput);
      setLocationInput('');
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="glass rounded-lg p-4 flex flex-col items-center text-sm">
      <div className="text-xl font-medium">{formattedTime}</div>
      <div className="text-xs text-muted-foreground">{formattedDate}</div>
      
      <div className="mt-3 flex flex-col items-center gap-1">
        {weatherIcons[weather.condition]}
        <div className="text-xl font-medium mt-1">{weather.temperature}°C</div>
        <span className="text-xs text-muted-foreground">{weatherTexts[weather.condition]}</span>
      </div>
      
      <div className="mt-3 flex items-center gap-1 text-xs">
        <MapPin className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">{weather.location}</span>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
              <Edit2 className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change Location</DialogTitle>
              <DialogDescription>
                Enter your city or region to get local weather updates
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                value={locationInput} 
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="E.g., London, New York, Tokyo"
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={changeLocation}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WeatherWidget;
