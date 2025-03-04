
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Translations } from '@/i18n/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguageContext = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
};

export { LanguageContext, translations };

// Translation helper function that can be used outside the context
export const translateKey = (key: string, language: string): string => {
  if (translations[language] && translations[language][key]) {
    return translations[language][key];
  }
  
  // Fallback to English if translation doesn't exist
  if (translations.english[key]) {
    return translations.english[key];
  }
  
  // If key doesn't exist at all, return the key itself
  return key;
};
