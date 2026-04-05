import { ThemeColors, ThemeId, themes } from '@/lib/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
    themeId: ThemeId;
    setThemeId: (id: ThemeId) => Promise<void>;
    colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeId, setThemeIdState] = useState<ThemeId>('classic');
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('user_theme');
                const validThemes: ThemeId[] = ['classic', 'vintage', 'cinema', 'neon', 'ocean', 'forest', 'sunset', 'midnight', 'rose', 'monochrome', 'galaxy', 'sakura', 'nord'];
                if (savedTheme && validThemes.includes(savedTheme as ThemeId)) {
                    setThemeIdState(savedTheme as ThemeId);
                }
            } catch (e) {
                console.error('[Theme] Error loading theme:', e);
            }
        };
        loadTheme();
    }, []);

    const setThemeId = async (id: ThemeId) => {
        setThemeIdState(id);
        await AsyncStorage.setItem('user_theme', id);
    };

    const colors = isDark ? themes[themeId].colors.dark : themes[themeId].colors.light;

    return (
        <ThemeContext.Provider value={{ themeId, setThemeId, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
