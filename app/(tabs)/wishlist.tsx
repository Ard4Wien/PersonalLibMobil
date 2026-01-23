import { MediaCard } from '@/components/media/MediaCard';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Book, Film, Heart } from 'lucide-react-native';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const WISH_FILTERS = [
    { label: 'Tümü', value: 'ALL', icon: Heart },
    { label: 'Kitap', value: 'BOOK', icon: Book },
    { label: 'İçerik', value: 'MEDIA', icon: Film },
];

import { PageHeader } from '@/components/ui/PageHeader';

export default function WishlistScreen() {
    const [filter, setFilter] = useState('ALL');
    const router = useRouter();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();
    const [deleteOpts, setDeleteOpts] = useState({ visible: false, id: '', title: '', type: 'book' as 'book' | 'movie' | 'series' });
    const [isDeleting, setIsDeleting] = useState(false);

    const { data: books, isLoading: bLoading, refetch: bRefetch } = useQuery({ queryKey: ['books'], queryFn: () => api.books.list() });
    const { data: movies, isLoading: mLoading, refetch: mRefetch } = useQuery({ queryKey: ['movies'], queryFn: () => api.movies.list() });
    const { data: series, isLoading: sLoading, refetch: sRefetch } = useQuery({ queryKey: ['series'], queryFn: () => api.series.list() });

    const isLoading = bLoading || mLoading || sLoading;
    const onRefresh = () => { bRefetch(); mRefetch(); sRefetch(); };

    const wishlistBooks = books?.filter(x => x.status === 'WISHLIST') || [];
    const wishlistMovies = movies?.filter(x => x.status === 'WISHLIST') || [];
    const wishlistSeries = series?.filter(x => x.status === 'WISHLIST') || [];

    const totalCount = wishlistBooks.length + wishlistMovies.length + wishlistSeries.length;

    const handleDelete = (id: string, title: string, type: 'book' | 'movie' | 'series') => {
        setDeleteOpts({ visible: true, id, title, type });
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            if (deleteOpts.type === 'book') await api.books.delete(deleteOpts.id);
            else if (deleteOpts.type === 'movie') await api.movies.delete(deleteOpts.id);
            else await api.series.delete(deleteOpts.id);

            queryClient.invalidateQueries({ queryKey: [deleteOpts.type === 'book' ? 'books' : deleteOpts.type === 'movie' ? 'movies' : 'series'] });
            showToast('İçerik silindi', 'success');
            setDeleteOpts({ ...deleteOpts, visible: false });
        } catch (err) {
            showToast('Silinemedi', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <View className="flex-1 bg-background pt-16">
            <PageHeader
                title="İstek Listesi"
                subtitle={`${totalCount} içerik bekliyor`}
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
                                : 'bg-surface border-slate-800'
                                }`}
                        >
                            <f.icon size={16} color={filter === f.value ? 'white' : '#94a3b8'} className="mr-2" />
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
                        <View className="bg-slate-900/50 p-6 rounded-full mb-4">
                            <Heart size={48} color="#64748b" />
                        </View>
                        <Text className="text-text-secondary text-lg">İstek listeniz boş</Text>
                    </View>
                ) : (
                    <View className="flex-row flex-wrap justify-between pb-10">
                        {(filter === 'ALL' || filter === 'BOOK') && wishlistBooks.map((item) => (
                            <MediaCard
                                key={item.id}
                                {...item}
                                onEdit={() => router.push({ pathname: '/modals/edit-book', params: { id: item.id } })}
                                onDelete={() => handleDelete(item.id, item.title || (item as any).name || 'Kitap', 'book')}
                            />
                        ))}
                        {(filter === 'ALL' || filter === 'MEDIA') && wishlistMovies.map((item) => (
                            <MediaCard
                                key={item.id}
                                {...item}
                                onEdit={() => router.push({ pathname: '/modals/edit-movie', params: { id: item.id } })}
                                onDelete={() => handleDelete(item.id, item.title || (item as any).name || 'Film', 'movie')}
                            />
                        ))}
                        {(filter === 'ALL' || filter === 'MEDIA') && wishlistSeries.map((item) => (
                            <MediaCard
                                key={item.id}
                                {...item}
                                onEdit={() => router.push({ pathname: '/modals/edit-series', params: { id: item.id } })}
                                onDelete={() => handleDelete(item.id, item.title || (item as any).name || 'Dizi', 'series')}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
            <DeleteConfirmModal
                visible={deleteOpts.visible}
                title="İstek Listesinden Kaldır"
                message={`"${deleteOpts.title}" öğesini istek listenizden silmek istediğinize emin misiniz?`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteOpts({ ...deleteOpts, visible: false })}
                isLoading={isDeleting}
            />
        </View>
    );
}
