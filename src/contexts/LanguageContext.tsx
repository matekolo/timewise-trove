
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  english: {
    dashboard: "Dashboard",
    planner: "Planner",
    habits: "Habits",
    notes: "Notes",
    calendar: "Calendar",
    achievements: "Achievements",
    settings: "Settings",
    reports: "Reports",
    darkMode: "Dark Mode",
    language: "Language",
    themeColor: "Theme Color",
    notifications: "Notifications",
    soundEffects: "Sound Effects",
    dailyReminder: "Daily Reminder",
    account: "Account",
    displayName: "Display Name",
    email: "Email",
    resetPassword: "Reset Password",
    deleteAccount: "Delete Account",
    saveSettings: "Save Settings",
    unlocked: "Unlocked",
    locked: "Locked",
    all: "All",
    claimed: "Claimed",
    claimReward: "Claim Reward",
    progress: "Progress",
    reward: "Reward",
    profileUpdated: "Profile updated",
    passwordResetSent: "Password reset email sent",
    settingsSaved: "Settings saved",
    toggle: "Toggle",
    pleaseWait: "Please wait...",
    rewardClaimed: "Reward claimed!",
    // Add more translations as needed
  },
  spanish: {
    dashboard: "Panel",
    planner: "Planificador",
    habits: "Hábitos",
    notes: "Notas",
    calendar: "Calendario",
    achievements: "Logros",
    settings: "Ajustes",
    reports: "Informes",
    darkMode: "Modo oscuro",
    language: "Idioma",
    themeColor: "Color del tema",
    notifications: "Notificaciones",
    soundEffects: "Efectos de sonido",
    dailyReminder: "Recordatorio diario",
    account: "Cuenta",
    displayName: "Nombre visible",
    email: "Correo electrónico",
    resetPassword: "Restablecer contraseña",
    deleteAccount: "Eliminar cuenta",
    saveSettings: "Guardar ajustes",
    unlocked: "Desbloqueado",
    locked: "Bloqueado",
    all: "Todos",
    claimed: "Reclamado",
    claimReward: "Reclamar recompensa",
    progress: "Progreso",
    reward: "Recompensa",
    profileUpdated: "Perfil actualizado",
    passwordResetSent: "Correo de restablecimiento enviado",
    settingsSaved: "Ajustes guardados",
    toggle: "Alternar",
    pleaseWait: "Por favor espere...",
    rewardClaimed: "¡Recompensa reclamada!",
    // Add more translations as needed
  },
  french: {
    dashboard: "Tableau de bord",
    planner: "Planificateur",
    habits: "Habitudes",
    notes: "Notes",
    calendar: "Calendrier",
    achievements: "Réalisations",
    settings: "Paramètres",
    reports: "Rapports",
    darkMode: "Mode sombre",
    language: "Langue",
    themeColor: "Couleur du thème",
    notifications: "Notifications",
    soundEffects: "Effets sonores",
    dailyReminder: "Rappel quotidien",
    account: "Compte",
    displayName: "Nom d'affichage",
    email: "E-mail",
    resetPassword: "Réinitialiser le mot de passe",
    deleteAccount: "Supprimer le compte",
    saveSettings: "Enregistrer les paramètres",
    unlocked: "Déverrouillé",
    locked: "Verrouillé",
    all: "Tous",
    claimed: "Réclamé",
    claimReward: "Réclamer la récompense",
    progress: "Progrès",
    reward: "Récompense",
    profileUpdated: "Profil mis à jour",
    passwordResetSent: "E-mail de réinitialisation envoyé",
    settingsSaved: "Paramètres enregistrés",
    toggle: "Basculer",
    pleaseWait: "Veuillez patienter...",
    rewardClaimed: "Récompense réclamée !",
    // Add more translations as needed
  },
  german: {
    dashboard: "Übersicht",
    planner: "Planer",
    habits: "Gewohnheiten",
    notes: "Notizen",
    calendar: "Kalender",
    achievements: "Erfolge",
    settings: "Einstellungen",
    reports: "Berichte",
    darkMode: "Dunkelmodus",
    language: "Sprache",
    themeColor: "Themenfarbe",
    notifications: "Benachrichtigungen",
    soundEffects: "Soundeffekte",
    dailyReminder: "Tägliche Erinnerung",
    account: "Konto",
    displayName: "Anzeigename",
    email: "E-Mail",
    resetPassword: "Passwort zurücksetzen",
    deleteAccount: "Konto löschen",
    saveSettings: "Einstellungen speichern",
    unlocked: "Freigeschaltet",
    locked: "Gesperrt",
    all: "Alle",
    claimed: "Beansprucht",
    claimReward: "Belohnung beanspruchen",
    progress: "Fortschritt",
    reward: "Belohnung",
    profileUpdated: "Profil aktualisiert",
    passwordResetSent: "Passwort-Reset-E-Mail gesendet",
    settingsSaved: "Einstellungen gespeichert",
    toggle: "Umschalten",
    pleaseWait: "Bitte warten...",
    rewardClaimed: "Belohnung beansprucht!",
    // Add more translations as needed
  }
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>('english');

  useEffect(() => {
    // Load language from settings
    const loadLanguage = () => {
      try {
        const savedSettings = localStorage.getItem('user-settings');
        if (savedSettings) {
          const { language: savedLanguage } = JSON.parse(savedSettings);
          if (savedLanguage && translations[savedLanguage]) {
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

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
