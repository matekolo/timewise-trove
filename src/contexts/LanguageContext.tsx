
import React, { ReactNode, useState, useEffect, useContext } from 'react';
import { LanguageContext, translateKey } from '@/hooks/useLanguageContext';

export interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<string>(() => {
    try {
      const savedSettings = localStorage.getItem('user-settings');
      if (savedSettings) {
        const { language } = JSON.parse(savedSettings);
        return language || 'english';
      }
    } catch (error) {
      console.error("Error loading language settings:", error);
    }
    return 'english';
  });

  useEffect(() => {
    // Save language to settings whenever it changes
    const saveLanguage = (newLanguage: string) => {
      try {
        const savedSettings = localStorage.getItem('user-settings');
        const settings = savedSettings ? JSON.parse(savedSettings) : {};
        settings.language = newLanguage;
        localStorage.setItem('user-settings', JSON.stringify(settings));
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('settings-updated'));
      } catch (error) {
        console.error("Error saving language settings:", error);
      }
    };

    saveLanguage(language);
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    return translateKey(key, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Export useLanguage hook
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
