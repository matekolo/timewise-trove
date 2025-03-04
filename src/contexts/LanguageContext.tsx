import React, { ReactNode, useState, useEffect } from 'react';
import { LanguageContext, translateKey } from '@/hooks/useLanguageContext';

export interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<string>('english');

  useEffect(() => {
    // Load language from settings
    const loadLanguage = () => {
      try {
        const savedSettings = localStorage.getItem('user-settings');
        if (savedSettings) {
          const { language: savedLanguage } = JSON.parse(savedSettings);
          if (savedLanguage) {
            setLanguage(savedLanguage);
          }
        }
      } catch (error) {
        console.error("Error loading language settings:", error);
      }
    };

    loadLanguage();

    // Listen for settings changes
    const handleStorageChange = () => {
      loadLanguage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settings-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settings-updated', handleStorageChange);
    };
  }, []);

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

// Export useLanguage hook as the main interface for components
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Import at the top of the file - add this back
import { useContext } from 'react';
