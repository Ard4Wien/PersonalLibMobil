import { StatusPicker } from '@/components/ui/StatusPicker';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { scheduleReadingNudge } from '@/lib/notifications';
import { MediaStatus } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ChevronLeft, Trash2, Tv } from 'lucide-react-native';
import React from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SeriesDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();
    const { t } = useLanguage();

    const STATUS_OPTIONS: { label: string; value: MediaStatus }[] = [
        { label: t('filterWishlist'), value: 'WISHLIST' },
        { label: t('statusWatching'), value: 'WATCHING' },
        { label: t('statusCompleted'), value: 'COMPLETED' },
        { label: t('filterDropped'), value: 'DROPPED' },
    ];

    const { data: seriesList } = useQuery({ queryKey: ['series'], queryFn: () => api.series.list() });
    const series = seriesList?.find(s => s.id === id);

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.series.updateStatus(id!, data),
        onSuccess: async (data: any, variables: any) => {
            queryClient.invalidateQueries({ queryKey: ['series'] });
            showToast(t('success'), 'success');

            if (variables.status === 'WATCHING') {
                try {
                    const settingsStr = await SecureStore.getItemAsync('user_settings');
                    const settings = settingsStr ? JSON.parse(settingsStr) : null;
                    if (settings?.pushNotifications && series) {
                        await scheduleReadingNudge(series.title || series.baslik || t('series'), 'dizi');
                    }
                } catch (e) {
                    if (__DEV__) console.error('[SeriesDetail] Nudge scheduling error:', e);
                }
            }
        },
        onError: (e: any) => {
            if (__DEV__) console.error('[SeriesDetail] Update error:', e);
            showToast(e.message || t('error'), 'error');
        },
    });

    const updateProgress = (field: 'lastSeason' | 'lastEpisode', delta: number) => {
        const currentValue = (series as any)[field] || 0;
        const newValue = Math.max(0, currentValue + delta);
        updateMutation.mutate({ [field]: newValue });
    };

    const deleteMutation = useMutation({
        mutationFn: () => api.series.delete(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['series'] });
            showToast(t('deleteSuccess'), 'success');
            router.back();
        },
        onError: (e: any) => {
            if (__DEV__) console.error('[SeriesDetail] Delete error:', e);
            showToast(e.message || t('deleteError'), 'error');
        },
    });

    const handleDelete = () => {
        Alert.alert(t('deleteSeries'), `"${series?.title || t('series')}" ${t('deleteQuestion')}`, [
            { text: t('cancel'), style: 'cancel' },
            { text: t('delete'), style: 'destructive', onPress: () => deleteMutation.mutate() },
        ]);
    };

    if (!series) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-text-secondary">{t('itemNotFound')}</Text>
            </View>
        );
    }

    const displayTitle = series.title || series.name || series.baslik || t('untitled');
    const displayCreator = series.creator || series.yapimci || series.writer || t('noCreator');
    const displayImage = series.coverImage || series.image || series.imageUrl || series.cover_image;

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="relative">
                {displayImage ? (
                    <Image source={{ uri: displayImage }} className="w-full h-80" resizeMode="cover" />
                ) : (
                    <View className="w-full h-80 bg-slate-900 items-center justify-center">
                        <Tv size={64} color="#64748b" />
                    </View>
                )}
                <View className="absolute inset-0 bg-black/40" />
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-4 bg-black/50 p-2 rounded-full"
                >
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View className="px-6 -mt-16 relative z-10">
                <Text className="text-white text-3xl font-bold mb-2">{displayTitle}</Text>
                <Text className="text-text-secondary text-lg mb-4">{displayCreator}</Text>

                {series.totalSeasons && (
                    <View className="mb-4">
                        <Text className="text-text-muted text-sm">{t('totalSeasons')}: {series.totalSeasons}</Text>
                    </View>
                )}

                <StatusPicker
                    label={t('status')}
                    options={STATUS_OPTIONS}
                    value={series.status}
                    onChange={(status) => updateMutation.mutate({ status })}
                    color="cyan"
                />

                {series.status === 'WATCHING' && (
                    <View className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl mb-6">
                        <Text className="text-white font-bold mb-4 opacity-70">{t('exportProgress')}</Text>

                        <View className="flex-row items-center justify-between mb-6">
                            <View>
                                <Text className="text-text-secondary text-xs uppercase font-bold tracking-wider mb-1">{t('lastSeason')}</Text>
                                <Text className="text-white text-2xl font-bold">{series.lastSeason || 0}</Text>
                            </View>
                            <View className="flex-row space-x-2">
                                <TouchableOpacity
                                    onPress={() => updateProgress('lastSeason', -1)}
                                    className="w-10 h-10 bg-slate-800 rounded-lg items-center justify-center active:bg-slate-700"
                                >
                                    <Text className="text-white text-xl">-</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => updateProgress('lastSeason', 1)}
                                    className="w-10 h-10 bg-cyan-600 rounded-lg items-center justify-center active:bg-cyan-700"
                                >
                                    <Text className="text-white text-xl">+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-text-secondary text-xs uppercase font-bold tracking-wider mb-1">{t('lastEpisode')}</Text>
                                <Text className="text-white text-2xl font-bold">{series.lastEpisode || 0}</Text>
                            </View>
                            <View className="flex-row space-x-2">
                                <TouchableOpacity
                                    onPress={() => updateProgress('lastEpisode', -1)}
                                    className="w-10 h-10 bg-slate-800 rounded-lg items-center justify-center active:bg-slate-700"
                                >
                                    <Text className="text-white text-xl">-</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => updateProgress('lastEpisode', 1)}
                                    className="w-10 h-10 bg-cyan-600 rounded-lg items-center justify-center active:bg-cyan-700"
                                >
                                    <Text className="text-white text-xl">+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    onPress={handleDelete}
                    disabled={deleteMutation.isPending}
                    className={`flex-row items-center justify-center space-x-2 bg-red-600/10 border border-red-500/30 py-4 rounded-xl mb-12 ${deleteMutation.isPending ? 'opacity-50' : ''}`}
                >
                    <Trash2 size={20} color="#ef4444" />
                    <Text className="text-red-500 font-bold">{t('deleteSeries')}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
