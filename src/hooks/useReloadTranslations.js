import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

// This hook ensures translations are properly loaded and refreshed on language change
function useReloadTranslations() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Get the stored language from localStorage
    const storedLang = localStorage.getItem('i18nextLng');
    
    // If there's a stored language preference, ensure it's being used
    if (storedLang && i18n.language !== storedLang) {
      i18n.changeLanguage(storedLang);
    }
    
    // Force reload of resources when the component mounts
    i18n.reloadResources();
    
    // Listen for language changes
    const handleLanguageChanged = () => {
      // Reload resources whenever language changes
      i18n.reloadResources()
        .catch(err => console.error('Failed to reload resources:', err));
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  return { i18n };
}

export default useReloadTranslations;