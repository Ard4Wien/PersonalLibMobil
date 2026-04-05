import Constants, { ExecutionEnvironment } from 'expo-constants';
import cancelAllScheduledNotificationsAsync from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import scheduleNotificationAsync from 'expo-notifications/build/scheduleNotificationAsync';
import setNotificationChannelAsync from 'expo-notifications/build/setNotificationChannelAsync';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getLanguage, tStatic } from './i18n';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configure how notifications are handled when the app is in the foreground
if (Platform.OS !== 'web') {
    setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

export const requestNotificationPermissions = async () => {
    try {
        const { status: existingStatus } = await getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return false;
        }

        if (Platform.OS === 'android') {
            await setNotificationChannelAsync('default', {
                name: 'default',
                importance: AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return true;
    } catch (e) {
        console.warn('[Notifications] Permission request error:', e);
        return false;
    }
};

export const scheduleReadingNudge = async (title: string, itemType: 'kitap' | 'film' | 'dizi') => {
    try {
        const lang = await getLanguage();
        await scheduleNotificationAsync({
            content: {
                title: tStatic('nudgeTitle', lang),
                body: `"${title}" ${tStatic('nudgeBody', lang)}`,
                data: { type: 'nudge' },
            },
            trigger: {
                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 60 * 60 * 24, // Schedule for 24 hours later as a sample
                repeats: false,
            } as any,
        });
    } catch (e) {
        console.warn('[Notifications] Nudge scheduling error:', e);
    }
};

export const scheduleForgottenReminder = async (title: string, itemType: 'kitap' | 'film' | 'dizi') => {
    try {
        const lang = await getLanguage();
        await scheduleNotificationAsync({
            content: {
                title: tStatic('reminderTitle', lang),
                body: `"${title}" ${tStatic('reminderBody', lang)}`,
                data: { type: 'forgotten' },
            },
            trigger: {
                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 60 * 60 * 24 * 7, // Schedule for 7 days later
                repeats: false,
            } as any,
        });
    } catch (e) {
        console.warn('[Notifications] Reminder scheduling error:', e);
    }
};

export const cancelAllNotifications = async () => {
    try {
        await cancelAllScheduledNotificationsAsync();
    } catch (e) {
        console.warn('[Notifications] Cancel error:', e);
    }
};

export const sendTestNotification = async () => {
    try {
        const lang = await getLanguage();
        await scheduleNotificationAsync({
            content: {
                title: tStatic('notificationsActive', lang),
                body: tStatic('notificationsActiveDesc', lang),
            },
            trigger: null, // Send immediately
        });
    } catch (e) {
        console.warn('[Notifications] Test notification error:', e);
    }
};

/**
 * Schedules a series of nudges for the next month (every 4 days)
 * with random selections from the provided reading/watching list.
 */
export const scheduleRandomNudge = async (activeItems: any[]) => {
    const active = activeItems.filter(item => {
        const status = (item.status || item.durum || '').toUpperCase();
        return status === 'READING' || status === 'WATCHING';
    });

    if (active.length === 0) return;

    try {
        const lang = await getLanguage();
        await cancelAllScheduledNotificationsAsync();

        for (let i = 1; i <= 5; i++) {
            const randomItem = active[Math.floor(Math.random() * active.length)];
            const title = randomItem.title || randomItem.baslik || randomItem.name || tStatic('untitled', lang);

            await scheduleNotificationAsync({
                content: {
                    title: tStatic('nudgeTitle', lang),
                    body: `"${title}" ${tStatic('nudgeBody', lang)}`,
                    data: { type: 'random_nudge', id: randomItem.id },
                },
                trigger: {
                    type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: 60 * 60 * 24 * 4 * i,
                    repeats: false,
                } as any,
            });
        }
    } catch (e) {
        console.warn('[Notifications] Random nudge scheduling error:', e);
    }
};

/**
 * Convenience function to sync all nudges if settings allow
 */
export const syncPeriodicNudges = async (allItems: any[]) => {
    try {
        const settingsStr = await SecureStore.getItemAsync('user_settings');
        const settings = settingsStr ? JSON.parse(settingsStr) : null;

        if (settings?.pushNotifications) {
            const lastSync = await SecureStore.getItemAsync('last_nudge_sync');
            const now = Date.now();

            if (lastSync) {
                const lastSyncTime = parseInt(lastSync, 10);
                const oneDay = 24 * 60 * 60 * 1000;
                if (now - lastSyncTime < oneDay) {
                    return;
                }
            }

            await scheduleRandomNudge(allItems);
            await SecureStore.setItemAsync('last_nudge_sync', now.toString());
        }
    } catch (e) {
        console.error('[Notifications] Sync error:', e);
    }
};
