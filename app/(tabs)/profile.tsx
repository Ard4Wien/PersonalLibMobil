import { useAuth } from '@/components/auth/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { Search, Settings, User as UserIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useCallback } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const queryOptions = {
        staleTime: 1000 * 60,
    };

    const { data: books, refetch: bRefetch } = useQuery({ queryKey: ['books'], queryFn: () => api.books.list(), ...queryOptions });
    const { data: movies, refetch: mRefetch } = useQuery({ queryKey: ['movies'], queryFn: () => api.movies.list(), ...queryOptions });
    const { data: series, refetch: sRefetch } = useQuery({ queryKey: ['series'], queryFn: () => api.series.list(), ...queryOptions });

    useFocusEffect(
        useCallback(() => {
            bRefetch();
            mRefetch();
            sRefetch();
        }, [])
    );

    const activeStatuses = ['COMPLETED'];

    const getStatus = (item: any) => {
        const rawStatus = item.status || item.Status || item.durum || item.Durum || item.overallStatus;
        return typeof rawStatus === 'string' ? rawStatus.toUpperCase() : rawStatus;
    };

    const bookCount = books?.filter(b => activeStatuses.includes(getStatus(b))).length || 0;
    const movieCount = movies?.filter(m => activeStatuses.includes(getStatus(m))).length || 0;
    const seriesCount = series?.filter(s => activeStatuses.includes(getStatus(s))).length || 0;

    return (
        <View className="flex-1 bg-background pt-16">
            {/* Search Users Button - Top Left */}
            <TouchableOpacity
                onPress={() => router.push('/search/users' as any)}
                className="absolute top-12 left-6 z-10 w-10 h-10 bg-surface border border-border rounded-full items-center justify-center shadow-sm"
            >
                <Search size={20} color={isDark ? "#94a3b8" : "#475569"} />
            </TouchableOpacity>

            {/* Menu Button - Top Right */}
            <TouchableOpacity
                onPress={() => router.push('/modals/profile-menu')}
                className="absolute top-12 right-6 z-10 w-10 h-10 bg-surface border border-border rounded-full items-center justify-center shadow-sm"
            >
                <Settings size={20} color={isDark ? "#94a3b8" : "#475569"} />
            </TouchableOpacity>

            <ScrollView className="flex-1 px-6">
                <View className="items-center mb-8">
                    <View className="relative">
                        <View className="w-24 h-24 rounded-full border-4 border-purple-600/50 bg-surface items-center justify-center overflow-hidden shadow-2xl shadow-purple-500/30">
                            {user?.avatarUrl ? (
                                <Image source={{ uri: user.avatarUrl }} className="w-full h-full" />
                            ) : (
                                <UserIcon size={48} color={isDark ? "#94a3b8" : "#cbd5e1"} />
                            )}
                        </View>
                    </View>
                    <Text className="text-text-primary text-2xl font-bold mt-4 text-center">{user?.displayName || 'Kullanıcı'}</Text>
                    <Text className="text-text-muted text-sm text-center">{user?.email}</Text>
                </View>

                {/* Stats Grid - Modern & Spacious */}
                <View className="flex-row gap-4 mb-8">
                    <View className={`items-center p-4 rounded-2xl flex-1 border shadow-sm ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-100'}`}>
                        <Text className={`font-bold text-3xl ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{bookCount}</Text>
                        <Text className={`text-[10px] uppercase font-bold text-center mt-1 tracking-wider ${isDark ? 'text-purple-300/60' : 'text-purple-600/70'}`}>{t('book')}</Text>
                    </View>
                    <View className={`items-center p-4 rounded-2xl flex-1 border shadow-sm ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                        <Text className={`font-bold text-3xl ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{movieCount}</Text>
                        <Text className={`text-[10px] uppercase font-bold text-center mt-1 tracking-wider ${isDark ? 'text-blue-300/60' : 'text-blue-600/70'}`}>{t('movie')}</Text>
                    </View>
                    <View className={`items-center p-4 rounded-2xl flex-1 border shadow-sm ${isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-pink-50 border-pink-100'}`}>
                        <Text className={`font-bold text-3xl ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>{seriesCount}</Text>
                        <Text className={`text-[10px] uppercase font-bold text-center mt-1 tracking-wider ${isDark ? 'text-pink-300/60' : 'text-pink-600/70'}`}>{t('series')}</Text>
                    </View>
                </View>

                <View className="bg-surface border border-border rounded-3xl p-6 mb-8 shadow-sm">
                    <Text className="text-text-secondary text-xs font-bold mb-4 uppercase tracking-widest opacity-50">{t('accountInfo')}</Text>

                    <View className="flex-row justify-between py-3 border-b border-border/50">
                        <Text className="text-text-muted">{t('email')}</Text>
                        <Text className="text-text-primary font-medium">{user?.email || 'kullanici@email.com'}</Text>
                    </View>
                    <View className="flex-row justify-between py-3 border-b border-border/50">
                        <Text className="text-text-muted">{t('username')}</Text>
                        <Text className="text-text-primary font-medium">@{user?.username || 'user'}</Text>
                    </View>
                    <View className="flex-row justify-between py-3">
                        <Text className="text-text-muted">{t('displayName')}</Text>
                        <Text className="text-text-primary font-medium">{user?.displayName || 'Kullanıcı'}</Text>
                    </View>
                </View>


            </ScrollView>
        </View>
    );
}
