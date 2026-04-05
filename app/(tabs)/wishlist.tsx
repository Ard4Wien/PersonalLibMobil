import { MediaCard } from '@/components/media/MediaCard';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { Book, Film, Heart } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { PageHeader } from '@/components/ui/PageHeader';

export default function WishlistScreen() {
    const [filter, setFilter] = useState('ALL');
    const router = useRouter();
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [deleteOpts, setDeleteOpts] = useState({ visible: false, id: '', title: '', type: 'book' as 'book' | 'movie' | 'series' });
    const [isDeleting, setIsDeleting] = useState(false);

    const { data: books, isLoading: bLoading, refetch: bRefetch } = useQuery({ queryKey: ['books'], queryFn: () => api.books.list() });
    const { data: movies, isLoading: mLoading, refetch: mRefetch } = useQuery({ queryKey: ['movies'], queryFn: () => api.movies.list() });
    const { data: series, isLoading: sLoading, refetch: sRefetch } = useQuery({ queryKey: ['series'], queryFn: () => api.series.list() });

    const WISH_FILTERS = [
        { label: t('filterAll'), value: 'ALL', icon: Heart },
        { label: t('filterBooks'), value: 'BOOK', icon: Book },
        { label: t('filterContent'), value: 'MEDIA', icon: Film },
    ];

    const isLoading = bLoading || mLoading || sLoading;
    const onRefresh = () => { bRefetch(); mRefetch(); sRefetch(); };

    useFocusEffect(
        useCallback(() => {
            onRefresh();
        }, [])
    );

    const getStatus = (item: any) => {
        const rawStatus = item.status || item.Status || item.durum || item.Durum || item.overallStatus;
        return typeof rawStatus === 'string' ? rawStatus.toUpperCase() : rawStatus;
    };

    const wishlistBooks = books?.filter(x => getStatus(x) === 'WISHLIST') || [];
    const wishlistMovies = movies?.filter(x => getStatus(x) === 'WISHLIST') || [];
    const wishlistSeries = series?.filter(x => getStatus(x) === 'WISHLIST') || [];

    const totalCount = wishlistBooks.length + wishlistMovies.length + wishlistSeries.length;

    const handleDelete = (id: string, title: string, type: 'book' | 'movie' | 'series') => {
        setDeleteOpts({ visible: true, id, title, type });
    };

    const toggleFavorite = async (id: string, isFavorite: boolean, type: 'book' | 'movie' | 'series') => {
        try {
            if (type === 'book') await api.books.updateStatus(id, { isFavorite: !isFavorite });
            else if (type === 'movie') await api.movies.updateStatus(id, { isFavorite: !isFavorite });
            else await api.series.updateStatus(id, { isFavorite: !isFavorite });

            queryClient.invalidateQueries({ queryKey: [type === 'book' ? 'books' : type === 'movie' ? 'movies' : 'series'] });
        } catch (err) {
            showToast(t('error'), 'error');
        }
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            if (deleteOpts.type === 'book') await api.books.delete(deleteOpts.id);
            else if (deleteOpts.type === 'movie') await api.movies.delete(deleteOpts.id);
            else await api.series.delete(deleteOpts.id);

            queryClient.invalidateQueries({ queryKey: [deleteOpts.type === 'book' ? 'books' : deleteOpts.type === 'movie' ? 'movies' : 'series'] });
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
                title={t('wishlist')}
                subtitle={`${totalCount} ${t('wishlistCount')}`}
                icon={Heart}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-6 max-h-12">
                <View className="flex-row space-x-2 mr-6">
                    {WISH_FILTERS.map((f) => (
                        <TouchableOpacity
                            key={f.value}
                            onPress={() => setFilter(f.value)}
                            className={`px-4 py-2 rounded-lg flex-row items-center space-x-2 border ${filter === f.value
                                ? 'bg-pink-600 border-pink-500'
                                : 'bg-surface border-border'
                                }`}
                        >
                            <f.icon size={16} color={filter === f.value ? 'white' : (isDark ? '#94a3b8' : '#64748b')} className="mr-2" />
                            <Text className={`${filter === f.value ? 'text-white' : 'text-text-secondary'} font-medium ml-2`}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <ScrollView
                className="flex-1 px-6"
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#db2777" />}
            >
                {totalCount === 0 ? (
                    <View className="items-center justify-center py-20">
                        <View className="bg-surface p-6 rounded-full mb-4 shadow-sm border border-border">
                            <Heart size={48} color={isDark ? "#64748b" : "#94a3b8"} />
                        </View>
                        <Text className="text-text-secondary text-lg">{t('emptyWishlist')}</Text>
                    </View>
                ) : (
                    <View className="flex-row flex-wrap justify-between pb-10">
                        {(filter === 'ALL' || filter === 'BOOK') && wishlistBooks.map((item) => (
                            <MediaCard
                                key={item.id}
                                {...item}
                                isHome={true}
                                onEdit={() => router.push({ pathname: '/modals/edit-book', params: { id: item.id } })}
                                onDelete={() => handleDelete(item.id, item.title || (item as any).name || t('book'), 'book')}
                                onToggleFavorite={() => toggleFavorite(item.id, item.isFavorite || false, 'book')}
                            />
                        ))}
                        {(filter === 'ALL' || filter === 'MEDIA') && wishlistMovies.map((item) => (
                            <MediaCard
                                key={item.id}
                                {...item}
                                isHome={true}
                                onEdit={() => router.push({ pathname: '/modals/edit-movie', params: { id: item.id } })}
                                onDelete={() => handleDelete(item.id, item.title || (item as any).name || t('movie'), 'movie')}
                                onToggleFavorite={() => toggleFavorite(item.id, item.isFavorite || false, 'movie')}
                            />
                        ))}
                        {(filter === 'ALL' || filter === 'MEDIA') && wishlistSeries.map((item) => (
                            <MediaCard
                                key={item.id}
                                {...item}
                                isHome={true}
                                onEdit={() => router.push({ pathname: '/modals/edit-series', params: { id: item.id } })}
                                onDelete={() => handleDelete(item.id, item.title || (item as any).name || t('series'), 'series')}
                                onToggleFavorite={() => toggleFavorite(item.id, item.isFavorite || false, 'series')}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
            <DeleteConfirmModal
                visible={deleteOpts.visible}
                title={deleteOpts.type === 'book' ? t('deleteBook') : deleteOpts.type === 'movie' ? t('deleteMovie') : t('deleteSeries')}
                message={`"${deleteOpts.title}" ${t('deleteQuestion')} ${t('deleteWarning')}`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteOpts({ ...deleteOpts, visible: false })}
                isLoading={isDeleting}
            />
        </View>
    );
}
