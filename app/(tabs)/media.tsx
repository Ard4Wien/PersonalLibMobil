import { MediaCard } from '@/components/media/MediaCard';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { Film, Tv , Clapperboard } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { PageHeader } from '@/components/ui/PageHeader';


export default function MediaScreen() {
    const [activeType, setActiveType] = useState('ALL');
    const router = useRouter();
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [deleteOpts, setDeleteOpts] = useState({ visible: false, id: '', title: '', type: 'movie' as 'movie' | 'series' });
    const [isDeleting, setIsDeleting] = useState(false);

    const { data: movies, isLoading: mLoading, refetch: mRefetch } = useQuery({ queryKey: ['movies'], queryFn: () => api.movies.list() });
    const { data: series, isLoading: sLoading, refetch: sRefetch } = useQuery({ queryKey: ['series'], queryFn: () => api.series.list() });

    const TYPE_FILTERS = [
        { label: t('filterAll'), value: 'ALL', icon: Film },
        { label: t('filterMovies'), value: 'MOVIE', icon: Film },
        { label: t('filterSeries'), value: 'SERIES', icon: Tv },
    ];

    const isLoading = mLoading || sLoading;
    const onRefresh = () => { mRefetch(); sRefetch(); };

    useFocusEffect(
        useCallback(() => {
            onRefresh();
        }, [])
    );

    const handleDelete = (id: string, title: string, type: 'movie' | 'series') => {
        setDeleteOpts({ visible: true, id, title, type });
    };

    const toggleFavorite = async (id: string, isFavorite: boolean, type: 'movie' | 'series') => {
        try {
            if (type === 'movie') await api.movies.updateStatus(id, { isFavorite: !isFavorite });
            else await api.series.updateStatus(id, { isFavorite: !isFavorite });

            queryClient.invalidateQueries({ queryKey: [type === 'movie' ? 'movies' : 'series'] });
        } catch (err) {
            showToast(t('error'), 'error');
        }
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            if (deleteOpts.type === 'movie') await api.movies.delete(deleteOpts.id);
            else await api.series.delete(deleteOpts.id);

            queryClient.invalidateQueries({ queryKey: [deleteOpts.type === 'movie' ? 'movies' : 'series'] });
            showToast(t('deleteSuccess'), 'success');
            setDeleteOpts({ ...deleteOpts, visible: false });
        } catch (err) {
            showToast(t('deleteError'), 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <View className="flex-1 bg-background pt-16">
            <PageHeader
                title={t('mediaArchive')}
                subtitle={`${(movies?.length || 0) + (series?.length || 0)} ${t('mediaCount')}`}
                icon={Clapperboard}
                rightAction={
                    <>
                        <TouchableOpacity
                            onPress={() => router.push('/modals/add-movie')}
                            className="w-10 h-10 bg-blue-600 rounded-xl items-center justify-center shadow-lg shadow-blue-500/20 active:bg-blue-700"
                        >
                            <Film size={18} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/modals/add-series')}
                            className="w-10 h-10 bg-purple-600 rounded-xl items-center justify-center shadow-lg shadow-purple-500/20 active:bg-purple-700 ml-2"
                        >
                            <Tv size={18} color="white" />
                        </TouchableOpacity>
                    </>
                }
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-6 max-h-12">
                <View className="flex-row space-x-2 mr-6">
                    {TYPE_FILTERS.map((f) => (
                        <TouchableOpacity
                            key={f.value}
                            onPress={() => setActiveType(f.value)}
                            className={`px-4 py-2 rounded-lg flex-row items-center space-x-2 border ${activeType === f.value
                                ? 'bg-blue-600 border-blue-500'
                                : 'bg-surface border-border'
                                }`}
                        >
                            <f.icon size={16} color={activeType === f.value ? 'white' : (isDark ? '#94a3b8' : '#64748b')} className="mr-2" />
                            <Text className={`${activeType === f.value ? 'text-white' : 'text-text-secondary'} font-medium ml-2`}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <ScrollView
                className="flex-1 px-6"
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#3b82f6" />}
            >
                {(!movies?.length && !series?.length) ? (
                    <View className="items-center justify-center py-20">
                        <View className="bg-surface p-6 rounded-full mb-4 shadow-sm border border-border">
                            <Clapperboard size={48} color={isDark ? "#64748b" : "#94a3b8"} />
                        </View>
                        <Text className="text-text-secondary text-lg">{t('noMedia')}</Text>
                    </View>
                ) : (
                    <View className="flex-row flex-wrap justify-between pb-10">
                        {(activeType === 'ALL' || activeType === 'MOVIE') && movies?.map((movie) => (
                            <MediaCard
                                key={movie.id}
                                {...movie}
                                isHome={true}
                                onEdit={() => router.push({ pathname: '/modals/edit-movie', params: { id: movie.id } })}
                                onDelete={() => handleDelete(movie.id, movie.title || (movie as any).name || t('movie'), 'movie')}
                                onToggleFavorite={() => toggleFavorite(movie.id, movie.isFavorite || false, 'movie')}
                            />
                        ))}
                        {(activeType === 'ALL' || activeType === 'SERIES') && series?.map((s) => (
                            <MediaCard
                                key={s.id}
                                {...s}
                                isHome={true}
                                onEdit={() => router.push({ pathname: '/modals/edit-series', params: { id: s.id } })}
                                onDelete={() => handleDelete(s.id, s.title || (s as any).name || t('series'), 'series')}
                                onToggleFavorite={() => toggleFavorite(s.id, s.isFavorite || false, 'series')}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
            <DeleteConfirmModal
                visible={deleteOpts.visible}
                title={deleteOpts.type === 'movie' ? t('deleteMovie') : t('deleteSeries')}
                message={`"${deleteOpts.title}" ${t('deleteQuestion')} ${t('deleteWarning')}`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteOpts({ ...deleteOpts, visible: false })}
                isLoading={isDeleting}
            />
        </View>
    );
}
