import { MediaCard } from '@/components/media/MediaCard';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

export default function FavoritesScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();
    const { t } = useLanguage();
    const [deleteModal, setDeleteModal] = useState({ visible: false, id: '', title: '', type: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    const { data: books, isLoading: bLoading, refetch: bRefetch } = useQuery({ queryKey: ['books'], queryFn: () => api.books.list() });
    const { data: movies, isLoading: mLoading, refetch: mRefetch } = useQuery({ queryKey: ['movies'], queryFn: () => api.movies.list() });
    const { data: series, isLoading: sLoading, refetch: sRefetch } = useQuery({ queryKey: ['series'], queryFn: () => api.series.list() });

    const isLoading = bLoading || mLoading || sLoading;
    const onRefresh = () => { bRefetch(); mRefetch(); sRefetch(); };

    // Filter only favorites
    const favoriteBooks = (books || []).filter(b => b.isFavorite).map(b => ({ ...b, mediaType: 'book' }));
    const favoriteMovies = (movies || []).filter(m => m.isFavorite).map(m => ({ ...m, mediaType: 'movie' }));
    const favoriteSeries = (series || []).filter(s => s.isFavorite).map(s => ({ ...s, mediaType: 'series' }));

    const favorites = [...favoriteBooks, ...favoriteMovies, ...favoriteSeries];

    const toggleFavorite = async (item: any) => {
        try {
            const { id, isFavorite, mediaType } = item;
            if (mediaType === 'book') await api.books.updateStatus(id, { isFavorite: !isFavorite });
            else if (mediaType === 'movie') await api.movies.updateStatus(id, { isFavorite: !isFavorite });
            else await api.series.updateStatus(id, { isFavorite: !isFavorite });

            queryClient.invalidateQueries({ queryKey: [mediaType === 'book' ? 'books' : mediaType === 'movie' ? 'movies' : 'series'] });
            showToast(t('success'), 'success');
        } catch (err) {
            showToast(t('error'), 'error');
        }
    };

    const handleDelete = (item: any) => {
        setDeleteModal({
            visible: true,
            id: item.id,
            title: item.title || item.name || t('filterContent'),
            type: item.mediaType
        });
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            if (deleteModal.type === 'book') await api.books.delete(deleteModal.id);
            else if (deleteModal.type === 'movie') await api.movies.delete(deleteModal.id);
            else await api.series.delete(deleteModal.id);

            queryClient.invalidateQueries({ queryKey: [deleteModal.type === 'book' ? 'books' : deleteModal.type === 'movie' ? 'movies' : 'series'] });
            showToast(t('deleteSuccess'), 'success');
            setDeleteModal({ visible: false, id: '', title: '', type: '' });
        } catch (err) {
            showToast(t('deleteError'), 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <View className="flex-1 bg-background pt-16">
            <PageHeader
                title={t('myFavorites')}
                subtitle={`${favorites.length} ${t('favoriteStats')}`}
                icon={Heart}
                iconColor="#ef4444"
                showBackButton
            />

            <ScrollView
                className="flex-1 px-6"
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#ef4444" />}
            >
                {favorites.length === 0 && !isLoading ? (
                    <View className="items-center justify-center py-24">
                        <View className="bg-surface p-6 rounded-full mb-4 shadow-sm border border-border">
                            <Heart size={48} color="#ef4444" />
                        </View>
                        <Text className="text-text-primary text-lg font-medium">{t('noFavorites')}</Text>
                        <Text className="text-text-secondary text-sm text-center mt-2 px-10">
                            {t('noFavoritesDesc')}
                        </Text>
                    </View>
                ) : (
                    <View className="flex-row flex-wrap justify-between pb-10">
                        {favorites.map((item) => (
                            <MediaCard
                                key={`${item.mediaType}-${item.id}`}
                                {...item}
                                onEdit={() => router.push({
                                    pathname: item.mediaType === 'book' ? '/modals/edit-book' : item.mediaType === 'movie' ? '/modals/edit-movie' : '/modals/edit-series',
                                    params: { id: item.id }
                                })}
                                onDelete={() => handleDelete(item)}
                                onToggleFavorite={() => toggleFavorite(item)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            <DeleteConfirmModal
                visible={deleteModal.visible}
                title={deleteModal.type === 'book' ? t('deleteBook') : deleteModal.type === 'movie' ? t('deleteMovie') : t('deleteSeries')}
                message={`"${deleteModal.title}" ${t('deleteQuestion')} ${t('deleteWarning')}`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ visible: false, id: '', title: '', type: '' })}
                isLoading={isDeleting}
            />
        </View>
    );
}
