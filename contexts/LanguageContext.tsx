import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, TranslationKey, translations } from '../lib/i18n';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('tr');

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLang = await AsyncStorage.getItem('user_language');
                const supportedLangs: Language[] = ['tr', 'en', 'fr', 'de', 'zh', 'es', 'ru', 'ja', 'pl', 'it', 'ar', 'pt'];
                
                if (savedLang && supportedLangs.includes(savedLang as Language)) {
                    setLanguageState(savedLang as Language);
                } else {
                    const systemLangCode = getLocales()[0]?.languageCode as any;
                    
                    if (systemLangCode && supportedLangs.includes(systemLangCode)) {
                        setLanguageState(systemLangCode as Language);
                    } else {
                        setLanguageState('en');
                    }
                }
            } catch (e) {
                console.error('[Language] Error loading language:', e);
            }
        };
        loadLanguage();
    }, []);

    const setLanguage = async (lang: Language) => {
        try {
            setLanguageState(lang);
            await AsyncStorage.setItem('user_language', lang);
        } catch (e) {
            console.error('[Language] Error saving language:', e);
        }
    };

    const t = (key: TranslationKey): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
