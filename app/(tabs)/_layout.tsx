import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Tabs } from 'expo-router';
import { Book, Film, Heart, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      key={t('home')}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: function HomeIcon({ color }) { return <Book size={20} color={color} />; },
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: t('media'),
          tabBarIcon: function MediaIcon({ color }) { return <Film size={24} color={color} />; },
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: t('wishlist'),
          tabBarIcon: function WishlistIcon({ color }) { return <Heart size={24} color={color} />; },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: function ProfileIcon({ color }) { return <User size={24} color={color} />; },
        }}
      />
    </Tabs>
  );
}
