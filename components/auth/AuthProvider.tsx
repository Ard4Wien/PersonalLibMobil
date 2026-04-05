import { api, getToken, removeToken, saveToken } from '@/lib/api';
import { User } from '@/lib/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

export interface SavedAccount {
    email: string;
    displayName?: string;
}

const SAVED_ACCOUNTS_KEY = 'saved_accounts';
const MIGRATION_DONE_KEY = 'migration_done_v1';

/**
 * SECURITY NOTE: 
 * We are storing the raw password in SecureStore to enable "Switch Account" functionality
 * without re-authenticating the user every time. While SecureStore is the most secure
 * place on the device, storing a refresh_token or session_token is preferred over the password.
 * This should be refactored once the backend supports long-lived session management.
 */
const getPasswordKey = (email: string) => `pwd_${email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;

const USER_DATA_KEY = 'user_data';

const getSavedAccounts = async (): Promise<SavedAccount[]> => {
    try {
        const data = await SecureStore.getItemAsync(SAVED_ACCOUNTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const addSavedAccount = async (account: SavedAccount, password: string) => {
    const accounts = await getSavedAccounts();
    const existingIndex = accounts.findIndex(a => a.email === account.email);
    if (existingIndex >= 0) {
        accounts[existingIndex] = account;
    } else {
        // Enforce a safe count limit for SecureStore (2KB limit on Android)
        if (accounts.length >= 10) {
            return; // Prevent adding more than 10 accounts
        }
        accounts.push(account);
    }
    await SecureStore.setItemAsync(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
    await SecureStore.setItemAsync(getPasswordKey(account.email), password);
};

const removeSavedAccount = async (email: string) => {
    const accounts = await getSavedAccounts();
    const filtered = accounts.filter(a => a.email !== email);
    await SecureStore.setItemAsync(SAVED_ACCOUNTS_KEY, JSON.stringify(filtered));
    await SecureStore.deleteItemAsync(getPasswordKey(email)).catch(() => { });
};

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: (forgetAccount?: boolean) => Promise<void>;
    savedAccounts: SavedAccount[];
    switchAccount: (email: string) => Promise<{ success: boolean; error?: string; removed?: boolean }>;
    refreshSavedAccounts: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const extractEssentialUserData = (user: User): Partial<User> => ({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
    const router = useRouter();
    const segments = useSegments();
    const isMounted = useRef(true);
    const lastLoginCredentials = useRef<{ email: string; password: string } | null>(null);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isLoading || !isMounted.current) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);

    const refreshSavedAccounts = async () => {
        const accounts = await getSavedAccounts();
        setSavedAccounts(accounts);
    };

    const migrateFromAsyncStorage = async () => {
        try {
            // Check if migration is already done
            const isDone = await SecureStore.getItemAsync(MIGRATION_DONE_KEY);
            if (isDone === 'true') return;

            // Check for saved accounts in AsyncStorage
            const oldAccounts = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
            if (oldAccounts) {
                const accounts = JSON.parse(oldAccounts);
                await SecureStore.setItemAsync(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
                await AsyncStorage.removeItem(SAVED_ACCOUNTS_KEY);
                if (__DEV__) console.log('[Auth] Migrated saved_accounts to SecureStore');
            }

            // Check for user data in AsyncStorage
            const oldUserData = await AsyncStorage.getItem(USER_DATA_KEY);
            if (oldUserData) {
                await SecureStore.setItemAsync(USER_DATA_KEY, oldUserData);
                await AsyncStorage.removeItem(USER_DATA_KEY);
                if (__DEV__) console.log('[Auth] Migrated user_data to SecureStore');
            }

            // Mark migration as done
            await SecureStore.setItemAsync(MIGRATION_DONE_KEY, 'true');
        } catch (e) {
            if (__DEV__) console.warn('[Auth] Migration error:', e);
        }
    };

    const checkAuth = async () => {
        try {
            // Run migration first
            await migrateFromAsyncStorage();

            const token = await getToken();
            await refreshSavedAccounts();

            if (token) {
                const storedUser = await SecureStore.getItemAsync(USER_DATA_KEY);

                if (storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        if (userData && userData.id) {
                            setUser(userData as User);
                        } else {
                            await logoutInternal(false);
                        }
                    } catch (parseError) {
                        await logoutInternal(false);
                    }
                } else {
                    await logoutInternal(false);
                }
            }
        } catch (e) {
            if (__DEV__) console.error('[Auth] checkAuth error:', e);
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
                SplashScreen.hideAsync().catch(() => { });
            }
        }
    };

    const login = async (credentials: any) => {
        const res = await api.auth.login(credentials);

        if (res.token && res.user) {
            await saveToken(res.token);
            const essentialData = extractEssentialUserData(res.user);
            await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(essentialData));

            lastLoginCredentials.current = { email: credentials.email, password: credentials.password };
            await addSavedAccount({ email: credentials.email, displayName: res.user.displayName || res.user.username }, credentials.password);
            await refreshSavedAccounts();

            setUser(res.user);
        } else {
            throw new Error('Geçersiz sunucu yanıtı');
        }
    };

    const register = async (data: any) => {
        const res = await api.auth.register(data);
        if (res.token && res.user) {
            await saveToken(res.token);
            const essentialData = extractEssentialUserData(res.user);
            await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(essentialData));

            lastLoginCredentials.current = { email: data.email, password: data.password };
            await addSavedAccount({ email: data.email, displayName: res.user.displayName || res.user.username }, data.password);
            await refreshSavedAccounts();

            setUser(res.user);
        }
    };

    const logoutInternal = async (removeFromSaved: boolean) => {
        if (removeFromSaved && user?.email) {
            await removeSavedAccount(user.email);
            await refreshSavedAccounts();
        }
        await removeToken();
        await SecureStore.deleteItemAsync(USER_DATA_KEY);
        setUser(null);
    };

    const logout = async (forgetAccount: boolean = true) => {
        await logoutInternal(forgetAccount);
    };

    const switchAccount = async (email: string): Promise<{ success: boolean; error?: string; removed?: boolean }> => {
        try {
            const password = await SecureStore.getItemAsync(getPasswordKey(email));
            if (!password) {
                await removeSavedAccount(email);
                await refreshSavedAccounts();
                return { success: false, error: 'Kayıtlı şifre bulunamadı', removed: true };
            }

            const res = await api.auth.login({ email, password });

            if (res.token && res.user) {
                await saveToken(res.token);
                const essentialData = extractEssentialUserData(res.user);
                await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(essentialData));

                await addSavedAccount({ email, displayName: res.user.displayName || res.user.username }, password);
                await refreshSavedAccounts();

                setUser(res.user);
                return { success: true };
            } else {
                await removeSavedAccount(email);
                await refreshSavedAccounts();
                return { success: false, error: 'Giriş başarısız', removed: true };
            }
        } catch (error: any) {
            const errorMsg = (error.message || '').toLowerCase();
            // Don't remove for network errors or timeouts
            const isTransientError = errorMsg.includes('network') ||
                errorMsg.includes('timeout') ||
                errorMsg.includes('ağ hatası') ||
                errorMsg.includes('vakit doldu');

            if (!isTransientError) {
                await removeSavedAccount(email);
                await refreshSavedAccounts();
                return { success: false, error: error.message || 'Email ve şifre uyuşmuyor', removed: true };
            }

            return { success: false, error: error.message || 'Hata oluştu', removed: false };
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, savedAccounts, switchAccount, refreshSavedAccounts }}>
            {isLoading ? (
                <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Minimal placeholder while splash is hiding */}
                </View>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
