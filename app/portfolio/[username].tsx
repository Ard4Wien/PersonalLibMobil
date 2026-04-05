import { useLanguage } from '@/contexts/LanguageContext';
import { api, PublicPortfolio } from '@/lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Book as BookIcon, ChevronLeft, Film, Heart, Lock, User as UserIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PortfolioScreen() {
    const { username } = useLocalSearchParams<{ username: string }>();
    const [data, setData] = useState<PublicPortfolio | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const fetchPortfolio = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const portfolioData = await api.user.getPublicPortfolio(username);
            if (__DEV__) {
                console.log('[Portfolio] Fetched data:', JSON.stringify(portfolioData, null, 2));
            }
            setData(portfolioData);
        } catch (err: any) {
            setError(err.message || t('error'));
        } finally {
            setLoading(false);
        }
    }, [username, t]);

    useEffect(() => {
        if (username) {
            fetchPortfolio();
        }
    }, [username, fetchPortfolio]);

    if (loading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator color="#9333ea" size="large" />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
                <TouchableOpacity onPress={() => router.back()} className="p-6">
                    <ChevronLeft size={24} color={isDark ? "#cbd5e1" : "#475569"} />
                </TouchableOpacity>
                <View className="flex-1 items-center justify-center px-6 -mt-20">
                    <View className="w-20 h-20 bg-red-500/10 rounded-3xl items-center justify-center mb-6">
                        <UserIcon size={40} color="#ef4444" />
                    </View>
                    <Text className="text-text-primary text-xl font-bold mb-2 text-center">{error || t('userNotFound')}</Text>
                    <TouchableOpacity onPress={fetchPortfolio} className="mt-4">
                        <Text className="text-purple-500 font-bold">{t('refreshNotifications')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const isPrivate = data.user ? (data.user.isPrivate ?? data.user.is_private) : (data.isPrivate ?? data.is_private);
    const resolvedUser = data.user || {
        username: data.username || username,
        displayName: (data as any).displayName,
        avatarUrl: (data as any).avatarUrl,
    };

    if (isPrivate) {
        return (
            <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
                <TouchableOpacity onPress={() => router.back()} className="p-6">
                    <ChevronLeft size={24} color={isDark ? "#cbd5e1" : "#475569"} />
                </TouchableOpacity>
                <View className="flex-1 items-center justify-center px-6 -mt-20">
                    <View className="w-24 h-24 bg-surface-light border border-border rounded-full items-center justify-center mb-6">
                        <Lock size={48} color={isDark ? "#94a3b8" : "#64748b"} />
                    </View>
                    <Text className="text-text-primary text-2xl font-bold mb-2">{t('profileIsPrivate')}</Text>
                    <Text className="text-text-muted text-center px-8">{t('privateProfileDesc')}</Text>
                </View>
            </View>
        );
    }

    const books = data.collections?.books || (data as any).books || [];
    const movies = data.collections?.movies || (data as any).movies || [];
    const series = data.collections?.series || (data as any).series || [];
    const user = resolvedUser;

    const renderSection = (title: string, items: any[], type: 'book' | 'movie' | 'series') => {
        if (!items || items.length === 0) return null;

        const Icon = type === 'book' ? BookIcon : Film;
        const color = type === 'book' ? '#9333ea' : type === 'movie' ? '#2563eb' : '#db2777';

        return (
            <View className="mb-8">
                <View className="flex-row items-center mb-4">
                    <View className="p-2 rounded-lg mr-3" style={{ backgroundColor: `${color}15` }}>
                        <Icon size={18} color={color} />
                    </View>
                    <Text className="text-text-primary text-lg font-bold">{title}</Text>
                    <View className="bg-surface-light px-2 py-0.5 rounded-full ml-3 border border-border/50">
                        <Text className="text-text-muted text-[10px] font-bold">{items.length}</Text>
                    </View>
                </View>

                <View className="flex-row flex-wrap gap-3">
                    {items.map((item, idx) => (
                        <View key={idx} className="w-[31%] mb-3">
                            <View className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-light border border-border/50">
                                {item.imageUrl || item.coverImage || item.image ? (
                                    <Image
                                        source={{ uri: api.utils.optimizeImage(item.imageUrl || item.coverImage || item.image) }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View className="flex-1 items-center justify-center">
                                        <Icon size={24} color={isDark ? "#334155" : "#e2e8f0"} />
                                    </View>
                                )}
                            </View>
                            <Text className="text-text-primary text-[10px] font-medium mt-1.5" numberOfLines={2}>
                                {item.name || item.title}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <ChevronLeft size={24} color={isDark ? "#cbd5e1" : "#475569"} />
                </TouchableOpacity>
                <Text className="text-text-primary font-bold text-lg">{t('portfolio')}</Text>
                <View className="w-6" />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
                {/* User Info */}
                <View className="items-center mt-4 mb-10">
                    <View className="w-24 h-24 rounded-full border-4 border-purple-600/30 bg-surface items-center justify-center overflow-hidden shadow-xl">
                        {user.avatarUrl ? (
                            <Image source={{ uri: user.avatarUrl }} className="w-full h-full" />
                        ) : (
                            <UserIcon size={48} color={isDark ? "#64748b" : "#cbd5e1"} />
                        )}
                    </View>
                    <Text className="text-text-primary text-2xl font-bold mt-4">
                        {user.displayName || user.username}
                    </Text>
                    <Text className="text-text-muted text-sm italic">@{user.username}</Text>
                </View>

                {/* Portfolio Content */}
                {renderSection(t('book'), books, 'book')}
                {renderSection(t('movie'), movies, 'movie')}
                {renderSection(t('series'), series, 'series')}

                {(!books?.length && !movies?.length && !series?.length) && (
                    <View className="items-center py-20">
                        <Heart size={48} color={isDark ? "#1e293b" : "#f1f5f9"} />
                        <Text className="text-text-muted mt-4">{t('noData')}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
