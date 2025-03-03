
import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Moon, MapPin, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface WeatherData {
  location: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'night';
  temperature: number;
}

const WeatherWidget = () => {
  const [time, setTime] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData>({
    location: localStorage.getItem('weather-location') || 'Gdańsk',
    condition: 'sunny',
    temperature: 0
  });
  
  const { toast } = useToast();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);

  // Fetch weather data when location changes or component mounts
  useEffect(() => {
    fetchWeatherData(weather.location);
  }, []);
  
  const fetchWeatherData = async (location: string) => {
    if (!location) return;
    
    setLoading(true);
    try {
      const API_KEY = 'bf2b389dca6cf193d644f1df78e7df5e'; // Free API key for OpenWeatherMap
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          q: location,
          appid: API_KEY,
          units: 'metric' // For temperature in Celsius
        }
      });
      
      if (response.data) {
        const data = response.data;
        const weatherId = data.weather[0].id;
        const isNight = !isDay(data.sys.sunrise, data.sys.sunset);
        
        // Map OpenWeatherMap condition codes to our condition types
        let condition: 'sunny' | 'cloudy' | 'rainy' | 'night' = 'sunny';
        
        if (isNight) {
          condition = 'night';
        } else if (weatherId >= 200 && weatherId < 600) {
          condition = 'rainy';
        } else if (weatherId >= 600 && weatherId < 700) {
          condition = 'cloudy';
        } else if (weatherId >= 700 && weatherId < 800) {
          condition = 'cloudy';
        } else if (weatherId === 800) {
          condition = 'sunny';
        } else if (weatherId > 800) {
          condition = 'cloudy';
        }
        
        setWeather({
          location: data.name,
          condition,
          temperature: Math.round(data.main.temp)
        });
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast({
        title: "Error fetching weather data",
        description: "Could not get weather for the selected location.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Check if it's day or night based on sunrise and sunset times
  const isDay = (sunrise: number, sunset: number) => {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return currentTime >= sunrise && currentTime < sunset;
  };
  
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
      fetchWeatherData(locationInput);
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
        {loading ? (
          <div className="animate-pulse h-6 w-6 bg-gray-200 rounded-full"></div>
        ) : (
          weatherIcons[weather.condition]
        )}
        <div className="text-xl font-medium mt-1">
          {loading ? (
            <div className="animate-pulse h-5 w-12 bg-gray-200 rounded"></div>
          ) : (
            `${weather.temperature}°C`
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {loading ? (
            <div className="animate-pulse h-3 w-16 bg-gray-200 rounded"></div>
          ) : (
            weatherTexts[weather.condition]
          )}
        </span>
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
