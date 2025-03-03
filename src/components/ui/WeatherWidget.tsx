
import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Moon } from 'lucide-react';

const WeatherWidget = () => {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<'sunny' | 'cloudy' | 'rainy' | 'night'>('sunny');
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000);
    
    // For demo purposes, randomly change weather
    const weatherTimer = setInterval(() => {
      const weathers: Array<'sunny' | 'cloudy' | 'rainy' | 'night'> = ['sunny', 'cloudy', 'rainy', 'night'];
      const randomWeather = weathers[Math.floor(Math.random() * weathers.length)];
      setWeather(randomWeather);
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
    sunny: <Sun className="h-5 w-5 text-yellow-500" />,
    cloudy: <Cloud className="h-5 w-5 text-gray-500" />,
    rainy: <CloudRain className="h-5 w-5 text-blue-500" />,
    night: <Moon className="h-5 w-5 text-indigo-400" />
  };
  
  const weatherTexts = {
    sunny: 'Sunny',
    cloudy: 'Cloudy',
    rainy: 'Rainy',
    night: 'Clear night'
  };

  return (
    <div className="glass rounded-lg p-3 flex flex-col items-center text-sm">
      <div className="text-xl font-medium">{formattedTime}</div>
      <div className="text-xs text-muted-foreground">{formattedDate}</div>
      <div className="mt-2 flex items-center gap-1">
        {weatherIcons[weather]}
        <span className="text-xs text-muted-foreground">{weatherTexts[weather]}</span>
      </div>
    </div>
  );
};

export default WeatherWidget;
