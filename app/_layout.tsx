import { AuthProvider } from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import "../global.css";

import { useColorScheme } from '@/hooks/use-color-scheme';
import * as SplashScreen from 'expo-splash-screen';

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

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modals/add-book" options={{ presentation: 'modal', title: 'Yeni Kitap Ekle' }} />
              <Stack.Screen name="modals/add-movie" options={{ presentation: 'modal', title: 'Yeni Film Ekle' }} />
              <Stack.Screen name="modals/add-series" options={{ presentation: 'modal', title: 'Yeni Dizi Ekle' }} />
              <Stack.Screen name="modals/edit-book" options={{ presentation: 'modal', title: 'Kitap Düzenle' }} />
              <Stack.Screen name="modals/edit-movie" options={{ presentation: 'modal', title: 'Film Düzenle' }} />
              <Stack.Screen name="modals/edit-series" options={{ presentation: 'modal', title: 'Dizi Düzenle' }} />
              <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="movie/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="series/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
