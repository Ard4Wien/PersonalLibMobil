import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';
import { exportLibraryAsText, exportLibraryData } from '@/lib/export';
import { cancelAllNotifications, requestNotificationPermissions, sendTestNotification } from '@/lib/notifications';
import { themes } from '@/lib/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { Bell, Check, ChevronLeft, ChevronRight, Download, FileText, Languages, Lock, LogOut, Moon, Palette, Plus, Shield, Trash2, Users } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SettingItem = ({ icon: Icon, label, value, onToggle, isDark, color = "#94a3b8", locked, t }: any) => (
    <TouchableOpacity
        activeOpacity={0.7}
        onPress={locked ? undefined : onToggle}
        className={`flex-row items-center justify-between p-4 border-b border-slate-800/50 ${locked ? 'opacity-50' : ''}`}
    >
        <View className="flex-row items-center flex-1">
            <View className="w-9 h-9 items-center justify-center mr-3 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                {locked ? <Lock size={16} color={color} /> : <Icon size={18} color={color} />}
            </View>
            <View className="flex-1">
                <Text className="text-text-primary font-medium">{label}</Text>
                {locked && <Text className="text-text-muted text-[10px]">{t('notImplemented')}</Text>}
            </View>
        </View>
        <View pointerEvents="none">
            <Switch
                value={locked ? false : value}
                disabled={locked}
                trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: `${color}80` }}
                thumbColor={value && !locked ? color : (isDark ? '#94a3b8' : '#f1f5f9')}
            />
        </View>
    </TouchableOpacity>
);

const ActionItem = ({ icon: Icon, label, onPress, isDark, color = "#94a3b8", sublabel, locked, t }: any) => (
    <TouchableOpacity
        onPress={locked ? undefined : onPress}
        disabled={locked}
        className={`flex-row items-center justify-between p-4 border-b border-slate-800/50 active:bg-slate-800/30 ${locked ? 'opacity-50' : ''}`}
    >
        <View className="flex-row items-center">
            <View className="w-9 h-9 items-center justify-center mr-3 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                {locked ? <Lock size={16} color={color} /> : <Icon size={18} color={color} />}
            </View>
            <View>
                <Text className="text-text-primary font-medium">{label}</Text>
                <Text className="text-text-secondary text-[10px]">{locked ? t('notImplemented') : sublabel}</Text>
            </View>
        </View>
        {!locked && <ChevronRight size={16} color={isDark ? "#475569" : "#94a3b8"} />}
    </TouchableOpacity>
);

export default function SettingsScreen() {
    const router = useRouter();
    const { logout, savedAccounts, switchAccount, user, refreshSavedAccounts } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const { show: showToast } = useToast();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();

    const { colorScheme, setColorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [localIsDark, setLocalIsDark] = useState(isDark);
    const [cacheSize, setCacheSize] = useState(14.2);
    const [isExporting, setIsExporting] = useState(false);
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
    const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const { themeId, setThemeId, colors } = useTheme();

    React.useEffect(() => {
        setLocalIsDark(isDark);
    }, [isDark]);

    const anyModalVisible = isLanguageModalVisible || isThemeModalVisible || isAccountModalVisible;

    React.useEffect(() => {
        if (Platform.OS === 'android') {
            if (anyModalVisible) {
                // When modal is open, force light buttons since overlay is always dark
                NavigationBar.setButtonStyleAsync('light');
            } else {
                // Restore theme-based button style
                NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
            }
        }
    }, [anyModalVisible, isDark]);

    React.useEffect(() => {
        const loadSettings = async () => {
            try {
                // Load local settings
                const storedSettings = await SecureStore.getItemAsync('user_settings');
                let localSettings = storedSettings ? JSON.parse(storedSettings) : null;

                // Load privacy setting from API
                const privacyData = await api.auth.getPrivacy().catch(() => null);

                if (localSettings || privacyData) {
                    const isPrivateValue = privacyData ? (privacyData.isPrivate ?? (privacyData as any).is_private) : null;

                    setSettings(prev => ({
                        ...prev,
                        ...(localSettings || {}),
                        ...(isPrivateValue !== null ? { privateProfile: !!isPrivateValue } : {})
                    }));
                }
            } catch (e) {
                console.error('[Settings] Error loading settings:', e);
            }
        };
        loadSettings();
    }, []);

    const [settings, setSettings] = useState({
        pushNotifications: false,
        weeklyDigest: false,
        privateProfile: false,
    });

    const toggleTheme = React.useCallback(() => {
        const nextTheme = localIsDark ? 'light' : 'dark';
        setLocalIsDark(!localIsDark);
        setColorScheme(nextTheme);
        SecureStore.setItemAsync('user_color_scheme', nextTheme).catch(err => {
            console.error('[Settings] Error saving theme:', err);
        });
        AsyncStorage.setItem('user_color_scheme', nextTheme).catch(err => {
            console.error('[Settings] Error saving theme:', err);
        });
    }, [localIsDark, setColorScheme]);

    const toggleSetting = React.useCallback(async (key: keyof typeof settings) => {
        const newValue = !settings[key];

        if (key === 'pushNotifications') {
            if (newValue) {
                const granted = await requestNotificationPermissions();
                if (!granted) {
                    showToast(t('permissionDenied'), 'error');
                    return;
                }
                await sendTestNotification();
                showToast(t('notificationsEnabled'), 'success');
            } else {
                await cancelAllNotifications();
                showToast(t('notificationsDisabled'), 'info');
            }
        }

        if (key === 'privateProfile') {
            try {
                await api.auth.updatePrivacy(newValue);
            } catch (e) {
                showToast(t('error'), 'error');
                return; // Don't update local state if API fails
            }
        }

        const newSettings = { ...settings, [key]: newValue };
        setSettings(newSettings);

        try {
            await SecureStore.setItemAsync('user_settings', JSON.stringify(newSettings));
        } catch (e) {
            console.error('[Settings] Error saving settings:', e);
        }
    }, [settings, showToast]);

    const handleClearCache = React.useCallback(() => {
        setCacheSize(0);
        showToast(t('cacheCleared'), 'success');
    }, [showToast, t]);

    const handleExportData = React.useCallback(async () => {
        if (isExporting) return;
        setIsExporting(true);
        showToast(t('preparingData'), 'info');
        try {
            await exportLibraryData();
            showToast(t('exportSuccess'), 'success');
        } catch (err) {
            showToast(t('exportError'), 'error');
        } finally {
            setIsExporting(false);
        }
    }, [isExporting, showToast, t]);

    const handleExportTextData = React.useCallback(async () => {
        if (isExporting) return;
        setIsExporting(true);
        showToast(t('preparingText'), 'info');
        try {
            await exportLibraryAsText();
            showToast(t('exportSuccess'), 'success');
        } catch (err) {
            showToast(t('exportError'), 'error');
        } finally {
            setIsExporting(false);
        }
    }, [isExporting, showToast, t]);

    const handleSwitchAccount = React.useCallback(async (email: string) => {
        if (isSwitching) return;
        if (email === user?.email) {
            setIsAccountModalVisible(false);
            return;
        }
        setIsSwitching(true);
        showToast(t('switchingAccount'), 'info');
        try {
            const result = await switchAccount(email);
            if (result.success) {
                // Invalidate all queries to force a fresh data fetch for the new account
                queryClient.invalidateQueries();
                
                showToast(t('accountSwitchSuccess'), 'success');
                setIsAccountModalVisible(false);
                // Redirect to home page (Books)
                router.replace('/(tabs)');
            } else {
                // If it was removed due to mismatch, show the specific warning
                if (result.removed) {
                    showToast(t('credentialsMismatch'), 'error');
                } else {
                    showToast(result.error || t('accountSwitchError'), 'error');
                }
            }
        } catch (err: any) {
            showToast(t('accountSwitchError'), 'error');
        } finally {
            setIsSwitching(false);
        }
    }, [isSwitching, user, switchAccount, showToast, t]);

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between px-6 pt-14 pb-6 border-b border-border">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-surface border border-border rounded-full items-center justify-center shadow-sm"
                >
                    <ChevronLeft size={24} color={isDark ? "#fff" : "#0f172a"} />
                </TouchableOpacity>
                <Text className="text-text-primary text-xl font-bold">{t('settings')}</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                <View className="mb-8">
                    <Text className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mb-3 ml-1">
                        {t('appearance')}
                    </Text>
                    <View className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                        <SettingItem
                            icon={Moon}
                            label={t('darkMode')}
                            value={localIsDark}
                            onToggle={toggleTheme}
                            isDark={isDark}
                            color="#a855f7"
                            t={t}
                        />
                        <TouchableOpacity
                            onPress={() => setIsLanguageModalVisible(true)}
                            className="flex-row items-center justify-between p-4 border-t border-slate-800/50 active:bg-slate-800/30"
                        >
                            <View className="flex-row items-center">
                                <View className="w-9 h-9 bg-blue-500/10 items-center justify-center mr-3 rounded-lg">
                                    <Languages size={18} color="#3b82f6" />
                                </View>
                                <View>
                                    <Text className="text-text-primary font-medium">{t('language')}</Text>
                                    <View className="flex-row items-center">
                                        <Text className="text-text-secondary text-[10px] uppercase font-bold tracking-tighter">
                                            {t('currentLanguageName')}
                                        </Text>
                                        <Text className="text-text-muted text-[10px] ml-1 opacity-50">
                                            • {language.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setIsThemeModalVisible(true)}
                            className="flex-row items-center justify-between p-4 border-t border-slate-800/50 active:bg-slate-800/30"
                        >
                            <View className="flex-row items-center">
                                <View className="w-9 h-9 bg-pink-500/10 items-center justify-center mr-3 rounded-lg">
                                    <Palette size={18} color="#ec4899" />
                                </View>
                                <View>
                                    <Text className="text-text-primary font-medium">{t('theme')}</Text>
                                    <Text className="text-text-secondary text-[10px] uppercase font-bold tracking-tighter">
                                        {t(`theme_${themeId}` as any)}
                                    </Text>
                                </View>
                            </View>
                            <ChevronRight size={16} color={isDark ? "#475569" : "#94a3b8"} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="mb-8">
                    <Text className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mb-3 ml-1">
                        {t('notifications')}
                    </Text>
                    <View className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                        <SettingItem
                            icon={Bell}
                            label={t('pushNotifications')}
                            value={settings.pushNotifications}
                            onToggle={() => toggleSetting('pushNotifications')}
                            isDark={isDark}
                            color="#3b82f6"
                            t={t}
                        />
                        <ActionItem
                            icon={Bell}
                            label={t('refreshNotifications')}
                            sublabel={t('refreshNotificationSub')}
                            onPress={async () => {
                                try {
                                    const { api } = await import('@/lib/api');
                                    const { syncPeriodicNudges } = await import('@/lib/notifications');
                                    const books = await api.books.list();
                                    const movies = await api.movies.list();
                                    const series = await api.series.list();
                                    await syncPeriodicNudges([...books, ...movies, ...series]);
                                    showToast(t('refreshSuccess'), 'success');
                                } catch (e) {
                                    showToast(t('error') + ': ' + (e as any).message, 'error');
                                }
                            }}
                            isDark={isDark}
                            color="#10b981"
                            t={t}
                        />
                        <SettingItem
                            icon={Bell}
                            label={t('weeklyDigest')}
                            value={settings.weeklyDigest}
                            onToggle={() => toggleSetting('weeklyDigest')}
                            isDark={isDark}
                            color="#3b82f6"
                            t={t}
                        />
                    </View>
                </View>

                <View className="mb-8">
                    <Text className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mb-3 ml-1">
                        {t('account')}
                    </Text>
                    <View className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                        <SettingItem
                            icon={Shield}
                            label={t('privateProfile')}
                            value={settings.privateProfile}
                            onToggle={() => toggleSetting('privateProfile')}
                            isDark={isDark}
                            color="#f59e0b"
                            t={t}
                        />
                        <ActionItem
                            icon={Lock}
                            label={t('changePassword')}
                            onPress={() => router.push('/modals/change-password')}
                            isDark={isDark}
                            color="#a855f7"
                            t={t}
                        />
                        <ActionItem
                            icon={Users}
                            label={t('switchAccount')}
                            sublabel={savedAccounts.length > 1 ? `${savedAccounts.length} ${t('savedAccounts').toLowerCase()}` : t('addNewAccount')}
                            onPress={() => setIsAccountModalVisible(true)}
                            isDark={isDark}
                            color="#10b981"
                            t={t}
                        />
                    </View>
                </View>

                <View className="mb-8">
                    <Text className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mb-3 ml-1">
                        {t('dataStorage')}
                    </Text>
                    <View className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                        <ActionItem
                            icon={Trash2}
                            label={t('clearCache')}
                            sublabel={`${cacheSize.toFixed(1)} MB ${t('cacheUsed')}`}
                            onPress={handleClearCache}
                            isDark={isDark}
                            color="#ef4444"
                            t={t}
                        />
                        <ActionItem
                            icon={Download}
                            label={t('exportJson')}
                            sublabel={t('exportJsonSub')}
                            onPress={handleExportData}
                            isDark={isDark}
                            color="#06b6d4"
                            t={t}
                        />
                        <ActionItem
                            icon={FileText}
                            label={t('exportTxt')}
                            sublabel={t('exportTxtSub')}
                            onPress={handleExportTextData}
                            isDark={isDark}
                            color="#10b981"
                            t={t}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => logout()}
                    className="flex-row items-center justify-center space-x-2 bg-red-600/10 border border-red-500/20 py-4 rounded-xl mb-12 active:bg-red-600/20"
                >
                    <LogOut size={18} color="#ef4444" />
                    <Text className="text-red-500 font-bold ml-2">{t('logout')}</Text>
                </TouchableOpacity>

                <View className="items-center pb-12">
                    <Text className="text-text-muted text-[10px] font-bold uppercase tracking-widest">PersonalLib</Text>
                    <Text className="text-text-secondary text-xs mt-1">v1.1.0 • Made with ❤️</Text>
                </View>
            </ScrollView>

            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />

            <Modal
                visible={isLanguageModalVisible}
                transparent={true}
                animationType="fade"
                statusBarTranslucent={true}
                navigationBarTranslucent={true}
                onShow={() => {
                    if (Platform.OS === 'android') {
                        NavigationBar.setButtonStyleAsync('light');
                    }
                }}
                onRequestClose={() => setIsLanguageModalVisible(false)}
            >
                <StatusBar style="light" />
                <Pressable
                    className="flex-1 bg-black/60 items-center justify-center px-6"
                    onPress={() => setIsLanguageModalVisible(false)}
                >
                    <Pressable
                        className="w-full bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View className="p-6 border-b border-border bg-surface">
                            <Text className="text-text-primary text-lg font-bold text-center">{t('language')}</Text>
                        </View>
                        <View className="p-2">
                            {(['tr', 'en', 'fr', 'de', 'ja', 'zh', 'es', 'ru', 'pl', 'it', 'ar'] as const).map((lang) => {
                                const isSelected = language === lang;
                                return (
                                    <TouchableOpacity
                                        key={lang}
                                        onPress={() => {
                                            setLanguage(lang);
                                            setIsLanguageModalVisible(false);
                                        }}
                                        className={`flex-row items-center justify-between p-4 rounded-2xl mb-1 ${isSelected ? 'bg-purple-600/10 border border-purple-500/20' : 'bg-transparent'}`}
                                    >
                                        <View className="flex-row items-center">
                                            <View className={`w-8 h-8 items-center justify-center rounded-lg mr-3 ${isSelected ? 'bg-purple-500' : 'bg-surface-light'}`}>
                                                <Text className="text-white font-bold text-xs uppercase">{lang}</Text>
                                            </View>
                                            <Text className={`text-base font-medium ${isSelected ? 'text-purple-500' : 'text-text-primary'}`}>
                                                {t(`lang_${lang}`)}
                                            </Text>
                                        </View>
                                        {isSelected && (
                                            <View className="w-2 h-2 rounded-full bg-purple-500" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TouchableOpacity
                            onPress={() => setIsLanguageModalVisible(false)}
                            className="m-4 py-4 bg-surface-light rounded-2xl items-center justify-center"
                        >
                            <Text className="text-text-primary font-bold">{t('cancel')}</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={isThemeModalVisible}
                transparent={true}
                animationType="fade"
                statusBarTranslucent={true}
                navigationBarTranslucent={true}
                onShow={() => {
                    if (Platform.OS === 'android') {
                        NavigationBar.setButtonStyleAsync('light');
                    }
                }}
                onRequestClose={() => setIsThemeModalVisible(false)}
            >
                <StatusBar style="light" />
                <Pressable
                    className="flex-1 bg-black/60 items-center justify-center px-6"
                    onPress={() => setIsThemeModalVisible(false)}
                >
                    <Pressable
                        className="w-full bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View className="p-6 border-b border-border bg-surface">
                            <Text className="text-text-primary text-lg font-bold text-center">{t('theme')}</Text>
                        </View>
                        <View className="p-2" style={{ maxHeight: 400 }}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {(['classic', 'vintage', 'cinema', 'neon', 'ocean', 'forest', 'sunset', 'midnight', 'rose', 'monochrome', 'galaxy', 'sakura', 'nord', 'dracula', 'monokai', 'solarized', 'matrix'] as const).map((id) => {
                                    const isSelected = themeId === id;
                                    const themeData = themes[id];
                                    const previewColors = isDark ? themeData.colors.dark : themeData.colors.light;
                                    return (
                                        <TouchableOpacity
                                            key={id}
                                            onPress={() => {
                                                setThemeId(id);
                                                setIsThemeModalVisible(false);
                                            }}
                                            className={`flex-row items-center justify-between p-4 rounded-2xl mb-1 ${isSelected ? 'bg-purple-600/10 border border-purple-500/20' : 'bg-transparent'}`}
                                        >
                                            <View className="flex-row items-center">
                                                <View className="flex-row mr-3">
                                                    <View style={{ backgroundColor: previewColors.primary, width: 12, height: 24, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }} />
                                                    <View style={{ backgroundColor: previewColors.accent, width: 12, height: 24 }} />
                                                    <View style={{ backgroundColor: previewColors.background, width: 12, height: 24, borderTopRightRadius: 6, borderBottomRightRadius: 6 }} />
                                                </View>
                                                <Text className={`text-base font-medium ${isSelected ? 'text-purple-500' : 'text-text-primary'}`}>
                                                    {t(`theme_${id}` as any)}
                                                </Text>
                                            </View>
                                            {isSelected && (
                                                <View className="w-2 h-2 rounded-full bg-purple-500" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                        <TouchableOpacity
                            onPress={() => setIsThemeModalVisible(false)}
                            className="m-4 py-4 bg-surface-light rounded-2xl items-center justify-center"
                        >
                            <Text className="text-text-primary font-bold">{t('cancel')}</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Account Switch Modal */}
            <Modal
                visible={isAccountModalVisible}
                animationType="slide"
                transparent={true}
                statusBarTranslucent={true}
                navigationBarTranslucent={true}
                onShow={() => {
                    if (Platform.OS === 'android') {
                        NavigationBar.setButtonStyleAsync('light');
                    }
                }}
                onRequestClose={() => setIsAccountModalVisible(false)}
            >
                <StatusBar style="light" />
                <Pressable
                    className="flex-1 bg-black/60 justify-end"
                    onPress={() => setIsAccountModalVisible(false)}
                >
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <View className="bg-surface rounded-t-3xl" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
                            <View className="items-center pt-4 pb-2">
                                <View className="w-12 h-1 bg-slate-600 rounded-full" />
                            </View>
                            <Text className="text-text-primary text-lg font-bold text-center py-2">
                                {t('switchAccount')}
                            </Text>
                            <ScrollView className="max-h-72">
                                {savedAccounts.length === 0 ? (
                                    <View className="py-8 items-center">
                                        <Text className="text-text-muted text-sm">{t('noSavedAccounts')}</Text>
                                    </View>
                                ) : (
                                    savedAccounts.map((account) => {
                                        const isCurrentAccount = account.email === user?.email;
                                        return (
                                            <TouchableOpacity
                                                key={account.email}
                                                disabled={isSwitching}
                                                onPress={() => handleSwitchAccount(account.email)}
                                                className={`flex-row items-center justify-between p-4 mx-4 mb-2 rounded-xl ${isCurrentAccount ? 'bg-green-500/10 border border-green-500/30' : 'bg-surface-light border border-border'}`}
                                            >
                                                <View className="flex-row items-center flex-1">
                                                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isCurrentAccount ? 'bg-green-500' : 'bg-purple-500'}`}>
                                                        <Text className="text-white font-bold text-lg">
                                                            {(account.displayName || account.email)[0].toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className={`font-medium ${isCurrentAccount ? 'text-green-500' : 'text-text-primary'}`}>
                                                            {account.displayName || account.email.split('@')[0]}
                                                        </Text>
                                                        <Text className="text-text-muted text-xs">{account.email}</Text>
                                                        {isCurrentAccount && (
                                                            <Text className="text-green-500 text-[10px] font-bold uppercase mt-1">
                                                                {t('currentAccount')}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                                {isCurrentAccount && (
                                                    <Check size={20} color="#10b981" />
                                                )}
                                                {isSwitching && !isCurrentAccount && (
                                                    <ActivityIndicator size="small" color="#a855f7" />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </ScrollView>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsAccountModalVisible(false);
                                    logout(false);
                                    router.replace('/(auth)/login');
                                }}
                                className="flex-row items-center justify-center mx-4 mt-2 py-4 bg-purple-500/10 rounded-2xl"
                            >
                                <Plus size={18} color="#a855f7" />
                                <Text className="text-purple-500 font-bold ml-2">{t('addNewAccount')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setIsAccountModalVisible(false)}
                                className="m-4 py-4 bg-surface-light rounded-2xl items-center justify-center"
                            >
                                <Text className="text-text-primary font-bold">{t('cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
