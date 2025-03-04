
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Translations } from '@/i18n/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation helper function
export const translateKey = (key: string, language: string): string => {
  try {
    // First check if it's a nested key (e.g. "settings.notifications")
    const keyParts = key.split('.');
    let translation: any = translations[language];
    
    for (const part of keyParts) {
      if (translation && translation[part]) {
        translation = translation[part];
      } else {
        // If no translation found, try English or return key
        translation = translations.english[key] || key;
        break;
      }
    }
    
    return typeof translation === 'string' ? translation : key;
  } catch (error) {
    console.error(`Translation error for key: ${key}`, error);
    return key;
  }
};

export const useLanguageContext = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
};

export { LanguageContext, translations };
