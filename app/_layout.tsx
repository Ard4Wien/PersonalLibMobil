import { AuthProvider } from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider , useQueryClient } from '@tanstack/react-query';
import * as NavigationBar from 'expo-navigation-bar';
import { addNotificationReceivedListener, addNotificationResponseReceivedListener } from 'expo-notifications/build/NotificationsEmitter';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme, vars } from 'nativewind';
import React, { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { AppState, Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import 'react-native-reanimated';

import "../global.css";

import * as SplashScreen from 'expo-splash-screen';

import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { syncPeriodicNudges } from '@/lib/notifications';

if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Centrally manages periodic notifications & data sync
 * Now follows "Lazy Loading" - only triggers when data is actually in cache
 */
function GlobalSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen for query success to sync nudges without explicit fetching here
    const unsubscribe = queryClient.getQueryCache().subscribe((event: any) => {
      if (event.type === 'updated' && event.action.type === 'success') {
        const books = queryClient.getQueryData(['books']) as any[];
        const movies = queryClient.getQueryData(['movies']) as any[];
        const series = queryClient.getQueryData(['series']) as any[];

        if (books || movies || series) {
          const allItems = [
            ...(books || []),
            ...(movies || []),
            ...(series || [])
          ];
          syncPeriodicNudges(allItems);
        }
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  return null;
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function ThemedApp() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { colors } = useTheme();

  const customTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  const themeVars = vars({
    "--background": colors.background,
    "--foreground": colors.textPrimary,
    "--surface": colors.surface,
    "--surface-light": colors.surfaceLight,
    "--text-primary": colors.textPrimary,
    "--text-secondary": colors.textSecondary,
    "--text-muted": colors.textMuted,
    "--border": colors.border,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [colors.background, isDark]);

  const [isActive, setIsActive] = React.useState(true);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Inactive is used on iOS when switching apps
      setIsActive(nextAppState === 'active');
    });

    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider value={customTheme}>
      <View style={[themeVars, styles.container, { backgroundColor: colors.background }]}>
        <GlobalSync />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="movie/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="series/[id]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.background} />
        
        {!isActive && (
          <BlurView 
            intensity={90} 
            tint={isDark ? 'dark' : 'light'} 
            style={StyleSheet.absoluteFill} 
          />
        )}
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();
  const [appIsReady, setAppIsReady] = React.useState(false);
  const router = useRouter();
  const url = Linking.useURL();

  useEffect(() => {
    const handleDeepLink = (url: string) => {
      const parsed = Linking.parse(url);
      const path = parsed.path;

      if (path) {
        // Blacklist sensitive routes from external triggers
        // Hardened: Now checks for exact starts and common patterns more robustly
        const isSensitive = 
          path.startsWith('settings') || 
          path.includes('change-password') ||
          path.includes('modals/edit-') ||
          path.includes('modals/add-') ||
          path.includes('profile/edit') ||
          path.includes('account');
        
        if (isSensitive) {
          if (__DEV__) console.warn('[Security Handled] Blocked external deep-link to sensitive route:', path);
          router.replace('/');
        }
      }
    };

    if (url) {
      handleDeepLink(url);
    }
  }, [url]);

  useEffect(() => {
    const initTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('user_color_scheme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setColorScheme(savedTheme);
        } else {
          setColorScheme('dark');
        }
      } catch (e) {
        setColorScheme('dark');
      } finally {
        setAppIsReady(true);
      }
    };
    initTheme();

    let notificationListener: any;
    let responseListener: any;

    try {
      notificationListener = addNotificationReceivedListener((notification: any) => {
        if (__DEV__) console.log('Notification received:', notification);
      });

      responseListener = addNotificationResponseReceivedListener((response: any) => {
        const data = response.notification.request.content.data;
        if (__DEV__) console.log('Notification response received:', data);
      });
    } catch (e) {
      console.warn('[RootLayout] Notifications listener setup failed:', e);
    }

    return () => {
      if (notificationListener) notificationListener.remove();
      if (responseListener) responseListener.remove();
    };
  }, []);

  useEffect(() => {
    if (appIsReady) {
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
        }
      };
      hideSplash();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CustomThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <ThemedApp />
            </AuthProvider>
          </ToastProvider>
        </CustomThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
