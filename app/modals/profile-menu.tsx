import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { Award, ChevronLeft, ChevronRight, Heart, Info, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function ProfileMenuModal() {
    const router = useRouter();
    const { t } = useLanguage();

    const MENU_ITEMS = [
        { id: 'favorites', label: t('favorites'), icon: Heart, route: '/favorites', color: '#ef4444' },
        { id: 'achievements', label: t('achievements'), icon: Award, route: '/achievements', color: '#fbbf24' },
        { id: 'settings', label: t('settings'), icon: Settings, route: '/settings', color: '#94a3b8' },
        { id: 'about', label: t('about'), icon: Info, route: '/about', color: '#60a5fa' },
    ];

    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const handlePress = (route: string) => {
        router.push(route as any);
    };

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between px-6 pt-14 pb-6 border-b border-border">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-surface border border-border rounded-full items-center justify-center shadow-sm"
                >
                    <ChevronLeft size={24} color={isDark ? "#fff" : "#000"} />
                </TouchableOpacity>
                <Text className="text-text-primary text-xl font-bold">{t('menu')}</Text>
                <View className="w-10" />
            </View>

            <View className="px-6 pt-8">

                <View className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
                    {MENU_ITEMS.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => handlePress(item.route)}
                            className={`flex-row items-center justify-between p-5 ${index !== MENU_ITEMS.length - 1 ? 'border-b border-border' : ''}`}
                        >
                            <View className="flex-row items-center">
                                <View
                                    className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                                    style={{ backgroundColor: `${item.color}20` }}
                                >
                                    <item.icon size={20} color={item.color} />
                                </View>
                                <Text className="text-text-primary font-semibold text-base">{item.label}</Text>
                            </View>
                            <ChevronRight size={20} color={isDark ? "#475569" : "#94a3b8"} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="mt-8 items-center">
                    <Text className="text-text-muted text-xs">PersonalLib Versiyon 1.1.0</Text>
                </View>
            </View>
        </View>
    );
}
