import { api, getToken, removeToken, saveToken } from '@/lib/api';
import { User } from '@/lib/types';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Only store essential user fields to avoid SecureStore size limit (2048 bytes)
const extractEssentialUserData = (user: User): Partial<User> => ({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        checkAuth();
    }, []);

    // Handle navigation based on auth state
    useEffect(() => {
        if (isLoading || !isMounted.current) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);

    const checkAuth = async () => {
        try {
            const token = await getToken();

            if (token) {
                const storedUser = await SecureStore.getItemAsync('user_data');

                if (storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        if (userData && userData.id) {
                            setUser(userData as User);
                        } else {
                            await logout();
                        }
                    } catch (parseError) {
                        await logout();
                    }
                } else {
                    await logout();
                }
            }
        } catch (e) {
            console.error('[Auth] checkAuth error:', e);
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
                // Hide splash screen after auth is checked and state is updated
                SplashScreen.hideAsync().catch(() => { });
            }
        }
    };

    const login = async (credentials: any) => {
        const res = await api.auth.login(credentials);

        if (res.token && res.user) {
            await saveToken(res.token);
            const essentialData = extractEssentialUserData(res.user);
            await SecureStore.setItemAsync('user_data', JSON.stringify(essentialData));

            setUser(res.user);
            // Router will handle navigation via useEffect
        } else {
            throw new Error('Geçersiz sunucu yanıtı');
        }
    };

    const register = async (data: any) => {
        const res = await api.auth.register(data);
        if (res.token && res.user) {
            await saveToken(res.token);
            const essentialData = extractEssentialUserData(res.user);
            await SecureStore.setItemAsync('user_data', JSON.stringify(essentialData));
            setUser(res.user);
        }
    };

    const logout = async () => {
        await removeToken();
        await SecureStore.deleteItemAsync('user_data');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
