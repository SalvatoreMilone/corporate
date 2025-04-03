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

i18n
  // Detect language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'en',
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
    }
  });

// Fix event handling for language changes
const originalChangeLanguage = i18n.changeLanguage;
i18n.changeLanguage = (lng) => {
  console.log(`Changing language to: ${lng}`);
  localStorage.setItem('i18nextLng', lng);
  // Force reload translations to ensure UI updates
  document.dispatchEvent(new Event('languageChanged'));
  return originalChangeLanguage.call(i18n, lng);
};

export default i18n;