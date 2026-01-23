import { StatusPicker } from '@/components/ui/StatusPicker';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { MediaStatus } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Film, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const STATUS_OPTIONS: { label: string; value: MediaStatus }[] = [
    { label: 'İstek Listesi', value: 'WISHLIST' },
    { label: 'İzleniyor', value: 'WATCHING' },
    { label: 'Tamamlandı', value: 'COMPLETED' },
    { label: 'Bırakıldı', value: 'DROPPED' },
];

export default function MovieDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { show: showToast } = useToast();

    const { data: movies } = useQuery({ queryKey: ['movies'], queryFn: () => api.movies.list() });
    const movie = movies?.find(m => m.id === id);

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.movies.update(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['movies'] });
            showToast('Durum güncellendi', 'success');
        },
        onError: (e: any) => {
            console.error('[MovieDetail] Update error:', e);
            showToast(e.message || 'Durum güncellenemedi', 'error');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.movies.delete(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['movies'] });
            showToast('Film silindi', 'success');
            router.back();
        },
        onError: (e: any) => {
            console.error('[MovieDetail] Delete error:', e);
            showToast(e.message || 'Film silinemedi', 'error');
        },
    });

    const handleDelete = () => {
        Alert.alert('Silme Onayı', 'Bu filmi silmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => deleteMutation.mutate() },
        ]);
    };

    if (!movie) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-text-secondary">Film bulunamadı</Text>
            </View>
        );
    }

    const displayTitle = movie.title || movie.name || movie.baslik || 'İsimsiz Film';
    const displayDirector = movie.director || movie.yonetmen || '';
    const displayImage = movie.coverImage || movie.image || movie.imageUrl || movie.cover_image;

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="relative">
                {displayImage ? (
                    <Image source={{ uri: displayImage }} className="w-full h-80" resizeMode="cover" />
                ) : (
                    <View className="w-full h-80 bg-slate-900 items-center justify-center">
                        <Film size={64} color="#64748b" />
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
                <Text className="text-text-secondary text-lg mb-4">{displayDirector}</Text>

                {movie.releaseYear && (
                    <View className="mb-4">
                        <Text className="text-text-muted text-sm">Yayın Yılı: {movie.releaseYear}</Text>
                    </View>
                )}

                <StatusPicker
                    label="Durum"
                    options={STATUS_OPTIONS}
                    value={movie.status}
                    onChange={(status) => updateMutation.mutate({ status })}
                    color="blue"
                />

                <TouchableOpacity
                    onPress={handleDelete}
                    disabled={deleteMutation.isPending}
                    className={`flex-row items-center justify-center space-x-2 bg-red-600/10 border border-red-500/30 py-4 rounded-xl mb-12 ${deleteMutation.isPending ? 'opacity-50' : ''}`}
                >
                    <Trash2 size={20} color="#ef4444" />
                    <Text className="text-red-500 font-bold">Filmi Sil</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
