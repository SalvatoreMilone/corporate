import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Component that forces re-render when language changes
const I18nProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [_, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  useEffect(() => {
    // Handler for language change
    const handleLanguageChanged = () => {
      console.log("Language changed, forcing update");
      forceUpdate();
    };
    
    // Listen for custom language change event
    document.addEventListener('languageChanged', handleLanguageChanged);
    
    // Listen for i18next language change
    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      document.removeEventListener('languageChanged', handleLanguageChanged);
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);
  
  return <>{children}</>;
};

export default I18nProvider;