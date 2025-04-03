import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationEN from './locales/en/translation.json';
import translationIT from './locales/it/translation.json';

// Translation resources
const resources = {
  en: {
    translation: translationEN
  },
  it: {
    translation: translationIT
  }
};

// Get stored language from localStorage
const getStoredLanguage = () => {
  try {
    const storedLang = localStorage.getItem('i18nextLng');
    return storedLang || 'en'; // Default to English if no stored language
  } catch (error) {
    console.error('Error getting language from localStorage:', error);
    return 'en';
  }
};

i18n
  // Detect language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: false, // Disable suspense for easier integration
      wait: true
    }
  });

// Function to reload language resources
const reloadResources = async () => {
  try {
    await i18n.reloadResources();
    console.log('i18n resources reloaded successfully');
  } catch (error) {
    console.error('Failed to reload i18n resources:', error);
  }
};

// Add the reloadResources function to i18n instance
i18n.reloadResources = reloadResources;

// Force initial load of resources
i18n.reloadResources();

export default i18n;