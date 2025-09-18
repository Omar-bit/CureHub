import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'en' ? 'Français' : 'English';
  };

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={toggleLanguage}
      className='flex items-center gap-2'
    >
      <Globe className='h-4 w-4' />
      <span className='hidden sm:inline'>{getCurrentLanguageLabel()}</span>
      <span className='sm:hidden'>{i18n.language.toUpperCase()}</span>
    </Button>
  );
};

export default LanguageSwitcher;
