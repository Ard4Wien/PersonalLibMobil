import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Award, ChevronLeft, Lock } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function AchievementsScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const { data: books, isLoading: bLoading } = useQuery({ queryKey: ['books'], queryFn: () => api.books.list() });
    const { data: movies, isLoading: mLoading } = useQuery({ queryKey: ['movies'], queryFn: () => api.movies.list() });
    const { data: series, isLoading: sLoading } = useQuery({ queryKey: ['series'], queryFn: () => api.series.list() });

    const isLoading = bLoading || mLoading || sLoading;

    // Robust status helper
    const getStatus = (item: any) => {
        const rawStatus = item.status || item.Status || item.durum || item.Durum || item.overallStatus;
        return typeof rawStatus === 'string' ? rawStatus.toUpperCase() : rawStatus;
    };

    // Calculation Logic
    const completedBooks = books?.filter(b => getStatus(b) === 'COMPLETED').length || 0;
    const completedMovies = movies?.filter(m => getStatus(m) === 'COMPLETED').length || 0;
    const completedSeries = series?.filter(s => getStatus(s) === 'COMPLETED').length || 0;

    const favoriteCount = [
        ...(books || []),
        ...(movies || []),
        ...(series || [])
    ].filter(item => item.isFavorite).length;

    const totalItems = (books?.length || 0) + (movies?.length || 0) + (series?.length || 0);

    const BADGES = [
        {
            id: 1,
            name: t('badgeBookworm'),
            desc: t('badgeBookwormDesc'),
            unlocked: completedBooks >= 5,
            progress: completedBooks,
            target: 5,
            color: '#a855f7'
        },
        {
            id: 2,
            name: t('badgeCinephile'),
            desc: t('badgeCinephileDesc'),
            unlocked: completedMovies >= 10,
            progress: completedMovies,
            target: 10,
            color: '#3b82f6'
        },
        {
            id: 3,
            name: t('badgeMarathoner'),
            desc: t('badgeMarathonerDesc'),
            unlocked: completedSeries >= 1,
            progress: completedSeries,
            target: 1,
            color: '#f43f5e'
        },
        {
            id: 4,
            name: t('badgeFavoriteMaster'),
            desc: t('badgeFavoriteMasterDesc'),
            unlocked: favoriteCount >= 5,
            progress: favoriteCount,
            target: 5,
            color: '#eab308'
        },
        {
            id: 5,
            name: t('badgeFirstStep'),
            desc: t('badgeFirstStepDesc'),
            unlocked: totalItems >= 1,
            progress: totalItems > 0 ? 1 : 0,
            target: 1,
            color: '#10b981'
        },
        {
            id: 6,
            name: t('badgeCollector'),
            desc: t('badgeCollectorDesc'),
            unlocked: totalItems >= 50,
            progress: totalItems,
            target: 50,
            color: '#f97316'
        },
    ];

    const unlockedCount = BADGES.filter(b => b.unlocked).length;

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between px-6 pt-14 pb-6 border-b border-border">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-surface border border-border rounded-full items-center justify-center shadow-sm"
                >
                    <ChevronLeft size={24} color={isDark ? "#fff" : "#0f172a"} />
                </TouchableOpacity>
                <Text className="text-text-primary text-xl font-bold">{t('achievements')}</Text>
                <View className="w-10" />
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#a855f7" />
                </View>
            ) : (
                <ScrollView className="flex-1 px-6 pt-6">
                    <View className="bg-surface border border-border p-6 rounded-3xl items-center mb-8 shadow-sm">
                        <Award size={48} color="#a855f7" />
                        <Text className="text-text-primary text-2xl font-bold mt-2">{unlockedCount} / {BADGES.length}</Text>
                        <Text className="text-text-secondary">{t('badgesWon')}</Text>
                    </View>

                    <View className="flex-row flex-wrap justify-between">
                        {BADGES.map((badge) => (
                            <View
                                key={badge.id}
                                className={`w-[48%] mb-4 p-4 rounded-3xl border ${badge.unlocked ? 'bg-surface border-border shadow-sm' : 'bg-surface-light border-border opacity-60'}`}
                            >
                                <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-3 ${badge.unlocked ? '' : 'bg-surface-light border border-border/50'}`} style={badge.unlocked ? { backgroundColor: `${badge.color}20` } : {}}>
                                    {badge.unlocked ? (
                                        <Award size={24} color={badge.color} />
                                    ) : (
                                        <Lock size={20} color={isDark ? "#334155" : "#94a3b8"} />
                                    )}
                                </View>
                                <Text className={`font-bold text-base ${badge.unlocked ? 'text-text-primary' : 'text-text-muted'}`}>
                                    {badge.name}
                                </Text>
                                <Text className={`text-[10px] mt-1 pr-1 ${badge.unlocked ? 'text-text-secondary' : 'text-text-muted'}`}>
                                    {badge.desc}
                                </Text>

                                {/* Progress indicator for locked badges */}
                                {!badge.unlocked && (
                                    <View className="mt-3">
                                        <View className="h-1 bg-surface-light rounded-full overflow-hidden border border-border/10">
                                            <View
                                                className="h-full bg-text-muted"
                                                style={{ width: `${Math.min(100, (badge.progress / badge.target) * 100)}%` }}
                                            />
                                        </View>
                                        <Text className="text-[9px] text-text-muted mt-1 font-bold">
                                            {badge.progress} / {badge.target}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                    <View className="pb-10" />
                </ScrollView>
            )}
        </View>
    );
}
